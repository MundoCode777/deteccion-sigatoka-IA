"""Métricas del modelo: acierto exacto, margen de ±1 nivel, tratamiento y falsos."""
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, f1_score

from . import config


def _tratamientos(niveles):
    return np.array([config.tratamiento_de(int(n)) for n in niveles])


def calcular(y_real, y_pred):
    y_real, y_pred = np.asarray(y_real), np.asarray(y_pred)
    enfermas, sanas = y_real >= 2, y_real <= 1
    return {
        "fotos": int(len(y_real)),
        "acierto_exacto": float(np.mean(y_real == y_pred)),
        "acierto_mas_menos_1": float(np.mean(np.abs(y_real - y_pred) <= 1)),
        "acierto_tratamiento": float(np.mean(_tratamientos(y_real) == _tratamientos(y_pred))),
        "f1_macro": float(f1_score(y_real, y_pred, average="macro", zero_division=0)),
        "enfermas_dadas_por_sanas": int(np.sum(enfermas & (y_pred <= 1))),
        "total_enfermas": int(enfermas.sum()),
        "sanas_dadas_por_enfermas": int(np.sum(sanas & (y_pred >= 2))),
        "total_sanas": int(sanas.sum()),
    }


def con_umbral(y_real, y_pred, confianza, umbral):
    """Resultados solo con las fotos que el modelo se atreve a responder."""
    y_real, y_pred = np.asarray(y_real), np.asarray(y_pred)
    aceptadas = np.asarray(confianza) >= umbral
    resultado = {
        "umbral": float(umbral),
        "cobertura": float(aceptadas.mean()),
        "no_concluyentes": int((~aceptadas).sum()),
    }
    if aceptadas.any():
        resultado.update(calcular(y_real[aceptadas], y_pred[aceptadas]))
    return resultado


def curva(y_real, y_pred, confianza):
    y_real, y_pred, confianza = map(np.asarray, (y_real, y_pred, confianza))
    puntos = []
    for umbral in np.round(np.arange(0.30, 0.96, 0.05), 2):
        aceptadas = confianza >= umbral
        if aceptadas.any():
            puntos.append(
                {
                    "umbral": float(umbral),
                    "cobertura": float(aceptadas.mean()),
                    "acierto_exacto": float(np.mean(y_real[aceptadas] == y_pred[aceptadas])),
                }
            )
    return puntos


def escoger_umbral(puntos, objetivo, cobertura_minima=0.40):
    """El umbral más bajo que llega al acierto buscado sin dejar de responder más del 60% de las fotos."""
    validos = [p for p in puntos if p["cobertura"] >= cobertura_minima]
    cumplen = [p for p in validos if p["acierto_exacto"] >= objetivo]
    if cumplen:
        return cumplen[0]["umbral"], True
    if validos:
        return max(validos, key=lambda p: p["acierto_exacto"])["umbral"], False
    return 0.50, False


def reporte_texto(y_real, y_pred):
    etiquetas = sorted(set(y_real) | set(y_pred))
    return classification_report(
        y_real, y_pred, labels=etiquetas, target_names=[f"level {n}" for n in etiquetas], zero_division=0, digits=3
    )


def por_nivel(y_real, y_pred):
    etiquetas = sorted(set(y_real) | set(y_pred))
    return classification_report(
        y_real, y_pred, labels=etiquetas, target_names=[f"level {n}" for n in etiquetas],
        zero_division=0, output_dict=True,
    )


def dibujar_matriz(y_real, y_pred, ruta):
    cm = confusion_matrix(y_real, y_pred, labels=config.NIVELES)
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.imshow(cm, cmap="Greens")
    ax.set_xticks(config.NIVELES)
    ax.set_yticks(config.NIVELES)
    ax.set_xlabel("Level predicho")
    ax.set_ylabel("Level real")
    ax.set_title("Matriz de confusión (fotos de prueba)")
    mitad = cm.max() / 2 if cm.max() else 0
    for i in config.NIVELES:
        for j in config.NIVELES:
            ax.text(j, i, cm[i, j], ha="center", va="center", color="white" if cm[i, j] > mitad else "black")
    fig.tight_layout()
    fig.savefig(ruta, dpi=110)
    plt.close(fig)


def dibujar_curva(puntos, umbral, ruta):
    fig, ax = plt.subplots(figsize=(6.5, 4.5))
    ax.plot([p["umbral"] for p in puntos], [p["acierto_exacto"] for p in puntos], marker="o", label="Acierto de las fotos respondidas")
    ax.plot([p["umbral"] for p in puntos], [p["cobertura"] for p in puntos], marker="s", label="Fotos respondidas")
    ax.axvline(umbral, linestyle="--", color="gray", label=f"Umbral elegido ({umbral:.2f})")
    ax.set_xlabel("Umbral de confianza")
    ax.set_ylim(0, 1.02)
    ax.set_title("Confianza vs. acierto (fotos de validación)")
    ax.grid(alpha=0.3)
    ax.legend()
    fig.tight_layout()
    fig.savefig(ruta, dpi=110)
    plt.close(fig)