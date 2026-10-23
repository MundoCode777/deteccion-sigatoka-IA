"""Rutas y reglas compartidas de la carpeta ia/."""
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]  # carpeta ia/
DATOS = RAIZ / "datos"
REGISTRO = DATOS / "registro_etiquetas.csv"
AJUSTES = DATOS / "ajustes.json"
MANIFIESTO = DATOS / "manifiesto.csv"

MODELOS = RAIZ / "modelos"
VERSIONES = MODELOS / "versiones"
ACTIVO = MODELOS / "activo.json"
ARCHIVO_MODELO = "modelo.cnnsvm"  # la CNN y el SVM, unidos en un solo archivo

NIVELES = list(range(7))  # level 0 a level 6
DESCARTADA = "descartada"
EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
TAM_IMAGEN = 224
SEMILLA = 42


def carpeta_nivel(nivel):
    return DATOS / f"level_{nivel}"


def tratamiento_de(nivel):
    """Reglas de la hacienda: level -> qué se hace."""
    if nivel <= 1:
        return "sana"
    if nivel <= 4:
        return "cirugia"
    return "deshoje"


def asegurar_carpetas():
    for nivel in NIVELES:
        carpeta_nivel(nivel).mkdir(parents=True, exist_ok=True)
    VERSIONES.mkdir(parents=True, exist_ok=True)


asegurar_carpetas()