"""Envía al backend el registro de cada entrenamiento (no usa librerías externas)."""
import json
import urllib.error
import urllib.request

from nucleo import config, versiones

TIEMPO_ESPERA = 15


def _ajustes():
    datos = {}
    archivo = config.RAIZ / ".env"
    if archivo.exists():
        for linea in archivo.read_text(encoding="utf-8").splitlines():
            linea = linea.strip()
            if linea and not linea.startswith("#") and "=" in linea:
                clave, valor = linea.split("=", 1)
                datos[clave.strip()] = valor.strip().strip('"').strip("'")
    return datos


def enviar_entrenamiento(registro):
    """POST {BACKEND_URL}/entrenamientos con la clave de la IA. Devuelve (ok, mensaje)."""
    ajustes = _ajustes()
    url = ajustes.get("BACKEND_URL", "http://localhost:8000").rstrip("/")
    clave = ajustes.get("CLAVE_IA", "")
    if not clave:
        return False, "Falta CLAVE_IA en el archivo ia/.env"

    peticion = urllib.request.Request(
        f"{url}/entrenamientos",
        data=json.dumps(registro, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-API-Key": clave},
        method="POST",
    )
    try:
        with urllib.request.urlopen(peticion, timeout=TIEMPO_ESPERA):
            return True, "Registrado en el backend"
    except urllib.error.HTTPError as error:
        try:
            detalle = json.loads(error.read().decode("utf-8")).get("detail", "")
        except Exception:
            detalle = ""
        return False, f"El backend respondió {error.code}" + (f": {detalle}" if detalle else "")
    except (urllib.error.URLError, TimeoutError, OSError):
        return False, "No se pudo conectar con el backend (¿está encendido?)"


def enviar_version(version):
    ok, mensaje = enviar_entrenamiento(versiones.registro(version))
    versiones.marcar_backend(version, ok, mensaje)
    return ok, mensaje


def reenviar_pendientes():
    """Reintenta las versiones que no pudieron registrarse. Devuelve (enviadas, siguen pendientes)."""
    enviadas = pendientes = 0
    for fila in versiones.listar():
        if not versiones.estado_backend(fila["version"]).get("enviado"):
            ok, _ = enviar_version(fila["version"])
            enviadas += int(ok)
            pendientes += int(not ok)
    return enviadas, pendientes