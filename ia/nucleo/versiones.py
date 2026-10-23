"""Registro de versiones del modelo: cada entrenamiento queda guardado y se puede activar."""
import json
from datetime import datetime

from . import config


def _nativo(valor):
    if hasattr(valor, "item"):  # tipos de numpy
        return valor.item()
    raise TypeError(f"No se puede guardar {type(valor)}")


def leer(archivo):
    return json.loads(archivo.read_text(encoding="utf-8"))


def guardar(archivo, datos):
    archivo.write_text(json.dumps(datos, indent=2, ensure_ascii=False, default=_nativo), encoding="utf-8")


def carpeta_de(version):
    return config.VERSIONES / version


def ruta_modelo(version):
    return carpeta_de(version) / config.ARCHIVO_MODELO


def _carpetas():
    config.VERSIONES.mkdir(parents=True, exist_ok=True)
    return sorted(p for p in config.VERSIONES.iterdir() if p.is_dir() and p.name[:1] == "v" and p.name[1:].isdigit())


def listar():
    filas = []
    for c in _carpetas():
        if all((c / n).exists() for n in ("config.json", "metricas.json", config.ARCHIVO_MODELO)):
            filas.append({"version": c.name, "config": leer(c / "config.json"), "metricas": leer(c / "metricas.json")})
    return filas


def siguiente_id():
    numeros = [int(c.name[1:]) for c in _carpetas()]
    return f"v{max(numeros, default=0) + 1:03d}"


def activa():
    if not config.ACTIVO.exists():
        return None
    version = leer(config.ACTIVO).get("version")
    return version if version and ruta_modelo(version).exists() else None


def activar(version):
    if not ruta_modelo(version).exists():
        raise FileNotFoundError(f"No existe la versión {version}")
    config.MODELOS.mkdir(parents=True, exist_ok=True)
    guardar(config.ACTIVO, {"version": version, "activada_en": datetime.now().isoformat(timespec="seconds")})


def estado_backend(version):
    archivo = carpeta_de(version) / "backend.json"
    return leer(archivo) if archivo.exists() else {"enviado": False, "mensaje": "Sin enviar"}


def marcar_backend(version, enviado, mensaje):
    guardar(
        carpeta_de(version) / "backend.json",
        {"enviado": enviado, "mensaje": mensaje, "fecha": datetime.now().isoformat(timespec="seconds")},
    )


def registro(version):
    """Lo que se envía al backend para llevar el historial de entrenamientos."""
    carpeta = carpeta_de(version)
    c, m = leer(carpeta / "config.json"), leer(carpeta / "metricas.json")
    return {
        "version": version,
        "creada_en": c["creada_en"],
        "cnn": c["cnn"],
        "ajuste_fino": c.get("ajuste_fino", True),
        "notas": c.get("notas", ""),
        "fotos": c["fotos"],
        "umbral_confianza": c["umbral_confianza"],
        "metricas": {"prueba": m["prueba"], "prueba_con_umbral": m["prueba_con_umbral"]},
        "software": c.get("software", {}),
        "activa": activa() == version,
    }