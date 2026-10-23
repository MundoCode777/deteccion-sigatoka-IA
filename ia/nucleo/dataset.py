"""Manejo del dataset: copia las fotos clasificadas, lleva el registro y permite deshacer."""
from __future__ import annotations

import csv
import hashlib
import json
import re
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from . import config

COLUMNAS = ["fecha", "etiqueta", "archivo_guardado", "nombre_original", "ruta_original", "hash"]


@dataclass
class Accion:
    etiqueta: str  # "level_3" o "descartada"
    original: Path  # foto de origen (nunca se modifica)
    guardada: Path | None  # copia dentro del dataset (None si se descartó)
    huella: str


def _clave_natural(ruta):
    """Orden natural: foto2 antes que foto10."""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", str(ruta))]


def leer_ajustes():
    try:
        return json.loads(config.AJUSTES.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def guardar_ajustes(ajustes):
    config.AJUSTES.write_text(json.dumps(ajustes, indent=2, ensure_ascii=False), encoding="utf-8")


class Dataset:
    def __init__(self):
        config.asegurar_carpetas()
        self.huellas = {}  # huella de la foto -> etiqueta (ya clasificada o descartada)
        self.conteos = {n: 0 for n in config.NIVELES}
        self.descartadas = 0
        self._pila = []  # acciones de esta sesión, para poder deshacer
        self._leer_registro()
        self._contar_carpetas()

    # ---------- estado ----------
    @property
    def total(self):
        return sum(self.conteos.values())

    def etiqueta_de(self, huella):
        return self.huellas.get(huella)

    def _leer_registro(self):
        if not config.REGISTRO.exists():
            return
        with open(config.REGISTRO, newline="", encoding="utf-8") as f:
            for fila in csv.DictReader(f):
                if fila.get("hash"):
                    self.huellas[fila["hash"]] = fila.get("etiqueta", "")
                if fila.get("etiqueta") == config.DESCARTADA:
                    self.descartadas += 1

    def _contar_carpetas(self):
        for nivel in config.NIVELES:
            self.conteos[nivel] = sum(
                1
                for p in config.carpeta_nivel(nivel).iterdir()
                if p.is_file() and p.suffix.lower() in config.EXTENSIONES
            )

    # ---------- fotos ----------
    @staticmethod
    def hash_de(ruta):
        h = hashlib.md5()
        with open(ruta, "rb") as f:
            for bloque in iter(lambda: f.read(1 << 20), b""):
                h.update(bloque)
        return h.hexdigest()

    @staticmethod
    def listar_fotos(carpeta, subcarpetas=True):
        carpeta = Path(carpeta).resolve()
        datos = config.DATOS.resolve()
        origen = carpeta.rglob("*") if subcarpetas else carpeta.glob("*")
        fotos = [
            p
            for p in origen
            if p.is_file() and p.suffix.lower() in config.EXTENSIONES and datos not in p.resolve().parents
        ]
        return sorted(fotos, key=_clave_natural)

    # ---------- acciones ----------
    def clasificar(self, ruta, nivel, huella):
        """Copia la foto a level_N con un nombre único. La original no se toca."""
        etiqueta = f"level_{nivel}"
        destino = config.carpeta_nivel(nivel) / f"{huella[:16]}{ruta.suffix.lower()}"
        shutil.copy2(ruta, destino)
        self._registrar(etiqueta, destino.name, ruta, huella)
        self.huellas[huella] = etiqueta
        self.conteos[nivel] += 1
        self._pila.append(Accion(etiqueta, ruta, destino, huella))

    def descartar(self, ruta, huella):
        """La foto no sirve (no es una hoja, está borrosa). Solo se anota para no volver a mostrarla."""
        self._registrar(config.DESCARTADA, "", ruta, huella)
        self.huellas[huella] = config.DESCARTADA
        self.descartadas += 1
        self._pila.append(Accion(config.DESCARTADA, ruta, None, huella))

    def deshacer(self):
        if not self._pila:
            return None
        accion = self._pila.pop()
        if accion.guardada is not None:
            accion.guardada.unlink(missing_ok=True)
            self.conteos[int(accion.etiqueta.split("_")[1])] -= 1
        else:
            self.descartadas -= 1
        self.huellas.pop(accion.huella, None)
        self._quitar_ultima_fila()
        return accion

    # ---------- registro ----------
    def _registrar(self, etiqueta, guardado, original, huella):
        nuevo = not config.REGISTRO.exists()
        with open(config.REGISTRO, "a", newline="", encoding="utf-8") as f:
            escritor = csv.writer(f)
            if nuevo:
                escritor.writerow(COLUMNAS)
            escritor.writerow(
                [datetime.now().isoformat(timespec="seconds"), etiqueta, guardado, original.name, str(original), huella]
            )

    def _quitar_ultima_fila(self):
        with open(config.REGISTRO, newline="", encoding="utf-8") as f:
            filas = list(csv.reader(f))
        if len(filas) > 1:
            filas.pop()
            with open(config.REGISTRO, "w", newline="", encoding="utf-8") as f:
                csv.writer(f).writerows(filas)