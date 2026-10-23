"""Modelo híbrido CNN + SVM. Es una sola pieza: se entrena, se guarda y se usa unida.

    foto ──► CNN (extrae 256 características) ──► SVM (decide el level 0-6 y su confianza)

En disco es un único archivo (modelo.cnnsvm) que contiene las dos partes.
"""
import json
import tempfile
import zipfile
from pathlib import Path

import joblib
import numpy as np
from sklearn.metrics import f1_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

from . import config, imagenes

CNNS = ("mobilenetv2", "efficientnetb0")
N_CARACTERISTICAS = 256


class Cancelado(Exception):
    """El usuario canceló el entrenamiento."""


def _keras():
    from tensorflow import keras  # se carga solo cuando hace falta (tarda unos segundos)

    return keras


class ModeloHibrido:
    def __init__(self, cnn="mobilenetv2"):
        if cnn not in CNNS:
            raise ValueError(f"CNN no disponible: {cnn}")
        self.extractor = None  # la CNN
        self.svm = None  # el SVM
        self.meta = {
            "cnn": cnn,
            "tam_imagen": config.TAM_IMAGEN,
            "clases": list(config.NIVELES),
            "umbral": 0.5,
            "version": None,
        }

    # ------------------------------------------------------------ entrenamiento
    @staticmethod
    def _construir_red(cnn, n_clases):
        keras = _keras()
        capas = keras.layers
        forma = (config.TAM_IMAGEN, config.TAM_IMAGEN, 3)

        foto = keras.Input(shape=forma, name="foto")  # valores de 0 a 255
        x = keras.Sequential(
            [
                capas.RandomFlip("horizontal_and_vertical"),
                capas.RandomRotation(0.15),
                capas.RandomZoom(0.15),
                capas.RandomBrightness(0.2, value_range=(0, 255)),
                capas.RandomContrast(0.2),
            ],
            name="variaciones",  # solo actúan al entrenar
        )(foto)

        if cnn == "mobilenetv2":
            x = capas.Rescaling(1 / 127.5, offset=-1)(x)
            base = keras.applications.MobileNetV2(
                include_top=False, weights="imagenet", input_shape=forma, pooling="avg"
            )
        else:  # EfficientNetB0 ya incluye su propio preprocesamiento
            base = keras.applications.EfficientNetB0(
                include_top=False, weights="imagenet", input_shape=forma, pooling="avg"
            )
        base.trainable = False

        x = base(x, training=False)
        x = capas.Dropout(0.3)(x)
        caracteristicas = capas.Dense(N_CARACTERISTICAS, activation="relu", name="caracteristicas")(x)
        salida = capas.Dense(n_clases, activation="softmax", name="nivel")(capas.Dropout(0.3)(caracteristicas))
        return keras.Model(foto, salida, name=f"cnn_{cnn}"), base

    def entrenar(
        self,
        X_tr,
        y_tr,
        X_va,
        y_va,
        ajuste_fino=True,
        epocas=12,
        registrar=print,
        avance=None,
        cancelado=lambda: False,
    ):
        """Entrena la CNN y después el SVM sobre lo que la CNN aprendió. X: fotos uint8; y: level 0-6."""
        keras = _keras()
        capas = keras.layers
        clases = config.NIVELES
        if set(np.unique(y_tr)) != set(clases):
            raise ValueError("El entrenamiento necesita fotos de los 7 niveles")
        keras.utils.set_random_seed(config.SEMILLA)

        cuentas = np.bincount(y_tr, minlength=len(clases))
        pesos = {c: float(len(y_tr) / (len(clases) * cuentas[c])) for c in clases}  # niveles con pocas fotos pesan más

        red, base = self._construir_red(self.meta["cnn"], len(clases))
        fase1 = min(5, epocas)
        fase2 = epocas if ajuste_fino else 0
        total = fase1 + fase2
        estado = {"hechas": 0}

        class Seguimiento(keras.callbacks.Callback):
            def on_train_batch_end(s, batch, logs=None):
                if cancelado():
                    s.model.stop_training = True

            def on_epoch_end(s, epoch, logs=None):
                logs = logs or {}
                estado["hechas"] += 1
                registrar(
                    f"   Época {estado['hechas']}/{total} · acierto {logs.get('accuracy', 0):.1%}"
                    f" · validación {logs.get('val_accuracy', 0):.1%}"
                )
                if avance:
                    avance(min(estado["hechas"] / total, 1.0))

        # Fase 1: la CNN aprende con las capas base congeladas
        registrar("Fase 1: la CNN aprende a reconocer los niveles (capas base congeladas)")
        red.compile(optimizer=keras.optimizers.Adam(1e-3), loss="sparse_categorical_crossentropy", metrics=["accuracy"])
        red.fit(
            X_tr, y_tr, validation_data=(X_va, y_va), epochs=fase1, batch_size=32,
            class_weight=pesos, callbacks=[Seguimiento()], verbose=0,
        )
        if cancelado():
            raise Cancelado()

        # Fase 2: ajuste fino, se afinan las últimas capas de la CNN con tus fotos
        epocas_hechas = estado["hechas"]
        if fase2:
            registrar("Fase 2: ajuste fino de la CNN con tus fotos")
            base.trainable = True
            for capa in base.layers[:-30]:
                capa.trainable = False
            for capa in base.layers:
                if isinstance(capa, capas.BatchNormalization):
                    capa.trainable = False
            red.compile(
                optimizer=keras.optimizers.Adam(1e-5), loss="sparse_categorical_crossentropy", metrics=["accuracy"]
            )
            red.fit(
                X_tr, y_tr, validation_data=(X_va, y_va), epochs=fase2, batch_size=32, class_weight=pesos,
                callbacks=[
                    Seguimiento(),
                    keras.callbacks.EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True),
                    keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=2),
                ],
                verbose=0,
            )
            if cancelado():
                raise Cancelado()
            epocas_hechas = estado["hechas"]

        # La CNN queda sin su capa final de decisión: ahora entrega características para el SVM
        self.extractor = keras.Model(red.input, red.get_layer("caracteristicas").output, name="extractor")

        # Fase 3: el SVM aprende a decidir el level con las características de la CNN
        registrar("Fase 3: el SVM aprende a decidir el level con las características de la CNN")
        F_tr, F_va = self.caracteristicas(X_tr), self.caracteristicas(X_va)
        mejor = None
        for C in (1, 10, 100):
            for gamma in ("scale", 0.0005):
                if cancelado():
                    raise Cancelado()
                svm = make_pipeline(StandardScaler(), SVC(kernel="rbf", C=C, gamma=gamma, class_weight="balanced"))
                svm.fit(F_tr, y_tr)
                f1 = f1_score(y_va, svm.predict(F_va), average="macro", zero_division=0)
                registrar(f"   SVM C={C} gamma={gamma}: F1 en validación {f1:.3f}")
                if mejor is None or f1 > mejor["f1"]:
                    mejor = {"C": C, "gamma": gamma, "f1": f1}

        registrar(f"   Elegido: C={mejor['C']}, gamma={mejor['gamma']}. Entrenando el SVM final...")
        self.svm = make_pipeline(
            StandardScaler(),
            SVC(
                kernel="rbf", C=mejor["C"], gamma=mejor["gamma"], class_weight="balanced",
                probability=True, random_state=config.SEMILLA,
            ),
        )
        self.svm.fit(F_tr, y_tr)

        self.meta["svm"] = {"C": mejor["C"], "gamma": mejor["gamma"]}
        return {"epocas_entrenadas": epocas_hechas, "f1_validacion": mejor["f1"], "svm": self.meta["svm"]}

    # ---------------------------------------------------------------- uso
    def caracteristicas(self, X, tam_lote=64):
        return self.extractor.predict(X, batch_size=tam_lote, verbose=0)

    def probabilidades(self, X):
        return self.svm.predict_proba(self.caracteristicas(X))

    def predecir_arrays(self, X):
        """Level y confianza de varias fotos ya cargadas."""
        proba = self.probabilidades(X)
        return self.svm.classes_[proba.argmax(axis=1)], proba.max(axis=1)

    def predecir(self, origen):
        """Analiza una foto (ruta o bytes). Es lo que usará el servicio de la app."""
        proba = self.probabilidades(imagenes.cargar_lote([origen]))[0]
        i = int(proba.argmax())
        nivel, confianza = int(self.svm.classes_[i]), float(proba[i])
        concluyente = confianza >= self.meta.get("umbral", 0.5)
        return {
            "nivel": nivel,
            "confianza": confianza,
            "concluyente": concluyente,
            "tratamiento": config.tratamiento_de(nivel) if concluyente else None,
            "probabilidades": {int(c): float(p) for c, p in zip(self.svm.classes_, proba)},
            "version": self.meta.get("version"),
        }

    # ------------------------------------------------------- guardar / cargar
    def guardar(self, ruta):
        """Guarda la CNN y el SVM juntos en un solo archivo."""
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            self.extractor.save(tmp / "cnn.keras")
            joblib.dump(self.svm, tmp / "svm.joblib")
            (tmp / "meta.json").write_text(json.dumps(self.meta, indent=2, ensure_ascii=False), encoding="utf-8")
            with zipfile.ZipFile(ruta, "w", zipfile.ZIP_STORED) as z:
                for nombre in ("cnn.keras", "svm.joblib", "meta.json"):
                    z.write(tmp / nombre, nombre)

    @classmethod
    def cargar(cls, ruta):
        keras = _keras()
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            with zipfile.ZipFile(ruta) as z:
                z.extractall(tmp)
            modelo = cls.__new__(cls)
            modelo.extractor = keras.models.load_model(tmp / "cnn.keras", compile=False)
            modelo.svm = joblib.load(tmp / "svm.joblib")
            modelo.meta = json.loads((tmp / "meta.json").read_text(encoding="utf-8"))
        return modelo