"""Lectura de fotos. El entrenamiento y el servicio usan exactamente la misma función."""
import io

import numpy as np
from PIL import Image, ImageOps

from . import config


def abrir(origen):
    """Abre una foto (ruta o bytes), corrige la rotación del celular y la pasa a RGB."""
    fuente = io.BytesIO(origen) if isinstance(origen, (bytes, bytearray)) else origen
    with Image.open(fuente) as img:
        img.draft("RGB", (config.TAM_IMAGEN * 2, config.TAM_IMAGEN * 2))  # acelera las fotos JPEG grandes
        return ImageOps.exif_transpose(img).convert("RGB")


def cargar(origen):
    """Foto lista para la CNN: arreglo uint8 de 224 x 224 x 3."""
    tam = config.TAM_IMAGEN
    return np.asarray(abrir(origen).resize((tam, tam), Image.Resampling.BILINEAR), dtype=np.uint8)


def cargar_lote(origenes, avance=None):
    fotos = []
    for i, origen in enumerate(origenes, 1):
        fotos.append(cargar(origen))
        if avance:
            avance(i, len(origenes))
    return np.stack(fotos)