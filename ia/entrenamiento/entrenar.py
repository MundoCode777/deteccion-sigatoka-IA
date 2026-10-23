"""Motor de entrenamiento: prepara las fotos, entrena el modelo híbrido CNN + SVM, lo evalúa,
lo guarda como una nueva versión y lo registra en el backend."""
import platform
import time
from datetime import datetime

from sklearn.metrics import f1_score

from conexion import backend
from nucleo import config, evaluacion as ev, imagenes, versiones
from nucleo.modelo import Cancelado, ModeloHibrido

from . import preparar

PARTICIONES = preparar.PARTICIONES


def ejecutar(opciones, registrar=print, avance=lambda fraccion, texto="": None, cancelado=lambda: False):
    inicio = time.time()

    # 1) Fotos
    avance(0.02, "Preparando las fotos")
    df, avisos = preparar.preparar(
        minimo=opciones.get("minimo", 20),
        similitud=opciones.get("similitud", 6),
        renovar_prueba=opciones.get("renovar_prueba", False),
        registrar=registrar,
    )
    if cancelado():
        raise Cancelado()

    partes = {p: df[df["particion"] == p] for p in PARTICIONES}
    y = {p: partes[p]["nivel"].to_numpy() for p in PARTICIONES}

    X = {}
    desde = {"entrenamiento": 0.05, "validacion": 0.10, "prueba": 0.13}
    for p in PARTICIONES:
        rutas = [config.RAIZ / r for r in partes[p]["ruta"]]
        registrar(f"Cargando {len(rutas)} fotos de {p}...")

        def paso(i, n, p=p):
            if cancelado():
                raise Cancelado()
            avance(desde[p] + 0.03 * i / n, f"Cargando fotos de {p}")

        X[p] = imagenes.cargar_lote(rutas, paso)

    # 2) Entrenar el modelo: CNN y SVM juntos
    registrar("\nEntrenando el modelo CNN + SVM...")
    modelo = ModeloHibrido(opciones.get("cnn", "mobilenetv2"))
    info = modelo.entrenar(
        X["entrenamiento"], y["entrenamiento"], X["validacion"], y["validacion"],
        ajuste_fino=opciones.get("ajuste_fino", True),
        epocas=opciones.get("epocas", 12),
        registrar=registrar,
        avance=lambda f: avance(0.16 + 0.60 * f, "Entrenando la CNN"),
        cancelado=cancelado,
    )

    # 3) Evaluar con fotos que el modelo nunca vio
    avance(0.80, "Evaluando con las fotos de prueba")
    registrar("\nEvaluando con fotos que el modelo nunca vio...")
    pred_va, conf_va = modelo.predecir_arrays(X["validacion"])
    puntos = ev.curva(y["validacion"], pred_va, conf_va)
    objetivo = opciones.get("objetivo", 0.90)
    umbral, cumple = ev.escoger_umbral(puntos, objetivo)  # el umbral se elige con validación, no con prueba

    pred_te, conf_te = modelo.predecir_arrays(X["prueba"])
    m_te = ev.calcular(y["prueba"], pred_te)
    m_um = ev.con_umbral(y["prueba"], pred_te, conf_te, umbral)

    # 4) Guardar como nueva versión (un solo archivo con la CNN y el SVM)
    avance(0.88, "Guardando la versión")
    vid = versiones.siguiente_id()
    carpeta = versiones.carpeta_de(vid)
    carpeta.mkdir(parents=True)
    modelo.meta.update({"version": vid, "umbral": umbral})
    modelo.guardar(carpeta / config.ARCHIVO_MODELO)
    ev.dibujar_matriz(y["prueba"], pred_te, carpeta / "matriz_confusion.png")
    ev.dibujar_curva(puntos, umbral, carpeta / "curva_confianza.png")
    (carpeta / "reporte.txt").write_text(ev.reporte_texto(y["prueba"], pred_te), encoding="utf-8")

    import sklearn
    import tensorflow as tf

    por_nivel = {
        str(n): {p: int(((df["nivel"] == n) & (df["particion"] == p)).sum()) for p in PARTICIONES}
        for n in config.NIVELES
    }
    versiones.guardar(
        carpeta / "config.json",
        {
            "version": vid,
            "creada_en": datetime.now().isoformat(timespec="seconds"),
            "notas": opciones.get("notas", ""),
            "cnn": opciones.get("cnn", "mobilenetv2"),
            "ajuste_fino": opciones.get("ajuste_fino", True),
            "epocas_entrenadas": info["epocas_entrenadas"],
            "svm": info["svm"],
            "umbral_confianza": umbral,
            "objetivo_acierto": objetivo,
            "umbral_cumple_objetivo": cumple,
            "fotos": {p: len(partes[p]) for p in PARTICIONES} | {"por_nivel": por_nivel},
            "semilla": config.SEMILLA,
            "software": {
                "python": platform.python_version(),
                "tensorflow": tf.__version__,
                "scikit_learn": sklearn.__version__,
            },
        },
    )
    versiones.guardar(
        carpeta / "metricas.json",
        {
            "prueba": m_te,
            "prueba_con_umbral": m_um,
            "por_nivel": ev.por_nivel(y["prueba"], pred_te),
            "curva_confianza_validacion": puntos,
            "f1_validacion": info["f1_validacion"],
        },
    )

    # 5) Activar solo si mejora a la versión que ya está en uso
    activada, motivo = False, ""
    actual = versiones.activa()
    if opciones.get("activar_si_mejora", True):
        if actual is None:
            activada, motivo = True, "es la primera versión"
        else:
            registrar(f"\nComparando con la versión activa {actual} usando las mismas fotos de prueba...")
            try:
                previo = ModeloHibrido.cargar(versiones.ruta_modelo(actual))
                pred_prev, _ = previo.predecir_arrays(X["prueba"])
                f1_prev = float(f1_score(y["prueba"], pred_prev, average="macro", zero_division=0))
                if m_te["f1_macro"] > f1_prev:
                    activada, motivo = True, f"mejora a {actual} (F1 {m_te['f1_macro']:.3f} contra {f1_prev:.3f})"
                else:
                    motivo = f"no supera a {actual} (F1 {m_te['f1_macro']:.3f} contra {f1_prev:.3f}); sigue activa {actual}"
            except Exception as error:
                motivo = f"no se pudo comparar con {actual} ({error}); sigue activa {actual}"
    else:
        motivo = "guardada sin activar"
    if activada:
        versiones.activar(vid)

    # 6) Registrar en el backend
    avance(0.95, "Registrando en el backend")
    registrar("Registrando el entrenamiento en el backend...")
    ok, mensaje = backend.enviar_version(vid)

    if not cumple:
        avisos.append(
            f"No se llegó al {objetivo:.0%} de acierto en validación respondiendo al menos el 40% de las fotos. "
            "Más fotos clasificadas, sobre todo de los levels con peor resultado, es lo que más ayuda."
        )
    if m_te["acierto_exacto"] >= 0.99:
        avisos.append(
            "Un acierto casi perfecto suele indicar fotos muy parecidas entre entrenamiento y prueba, "
            "o muy pocas fotos de prueba. Revisa los datos antes de confiar en este número."
        )

    avance(1.0, "Listo")
    return {
        "version": vid,
        "minutos": (time.time() - inicio) / 60,
        "metricas": m_te,
        "con_umbral": m_um,
        "umbral": umbral,
        "activada": activada,
        "motivo": motivo,
        "backend_ok": ok,
        "backend_mensaje": mensaje,
        "avisos": avisos,
    }