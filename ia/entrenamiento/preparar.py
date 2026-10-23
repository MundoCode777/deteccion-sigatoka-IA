"""Reparte las fotos clasificadas (datos/level_0 ... level_6) en entrenamiento / validación / prueba.

- Las fotos casi idénticas se mantienen juntas, para que la prueba sea honesta.
- La prueba queda congelada entre entrenamientos: todas las versiones se miden con las mismas fotos.
"""
import hashlib
import random

import pandas as pd
from PIL import Image, ImageOps

from nucleo import config

PARTICIONES = ("entrenamiento", "validacion", "prueba")
PRIORIDAD = ("prueba", "validacion", "entrenamiento")  # si un grupo ya tiene fotos en varias, manda la de prueba


class DatosInsuficientes(Exception):
    """Faltan fotos para poder entrenar."""


def md5(ruta):
    return hashlib.md5(ruta.read_bytes()).hexdigest()


def escanear():
    fotos, invalidas = [], []
    for nivel in config.NIVELES:
        for ruta in sorted(config.carpeta_nivel(nivel).iterdir()):
            if not ruta.is_file() or ruta.suffix.lower() not in config.EXTENSIONES:
                continue
            try:
                with Image.open(ruta) as img:
                    img.verify()
            except Exception:
                invalidas.append(ruta)
                continue
            fotos.append({"ruta": ruta, "nivel": nivel, "hash": md5(ruta)})
    return fotos, invalidas


def quitar_repetidas(fotos):
    primera, repetidas, conflicto = {}, [], set()
    for f in fotos:
        previa = primera.get(f["hash"])
        if previa is None:
            primera[f["hash"]] = f
        elif previa["nivel"] != f["nivel"]:
            conflicto.add(f["hash"])  # la misma foto clasificada en dos levels distintos
        else:
            repetidas.append(f)
    unicas = [f for f in primera.values() if f["hash"] not in conflicto]
    return unicas, repetidas, [f for f in fotos if f["hash"] in conflicto]


def huella_visual(ruta):
    """Huella de 64 bits: fotos casi iguales tienen huellas casi iguales."""
    with Image.open(ruta) as img:
        img.draft("RGB", (160, 160))
        pequena = ImageOps.exif_transpose(img).convert("L").resize((9, 8), Image.Resampling.LANCZOS)
    pixeles = list(pequena.getdata())
    valor = 0
    for fila in range(8):
        for col in range(8):
            valor = (valor << 1) | int(pixeles[fila * 9 + col + 1] > pixeles[fila * 9 + col])
    return valor


def construir_grupos(fotos, distancia, registrar):
    """Agrupa las fotos casi idénticas para que nunca queden repartidas entre entrenamiento y prueba."""
    padre = list(range(len(fotos)))

    def raiz(i):
        while padre[i] != i:
            padre[i] = padre[padre[i]]
            i = padre[i]
        return i

    def unir(a, b):
        ra, rb = raiz(a), raiz(b)
        if ra != rb:
            padre[max(ra, rb)] = min(ra, rb)

    if distancia >= 0 and len(fotos) > 1:
        registrar("Buscando fotos casi idénticas...")
        huellas = []
        for f in fotos:
            try:
                huellas.append(huella_visual(f["ruta"]))
            except Exception:
                huellas.append(None)

        trozos = distancia + 1  # con este número de trozos, dos huellas parecidas siempre comparten uno
        base, resto = divmod(64, trozos)
        tamanos = [base + (1 if k < resto else 0) for k in range(trozos)]
        for k, tam in enumerate(tamanos):
            desplazamiento, mascara = sum(tamanos[:k]), (1 << tam) - 1
            cubos = {}
            for i, h in enumerate(huellas):
                if h is not None:
                    cubos.setdefault((h >> desplazamiento) & mascara, []).append(i)
            for miembros in cubos.values():
                for a in range(len(miembros)):
                    for b in range(a + 1, len(miembros)):
                        if bin(huellas[miembros[a]] ^ huellas[miembros[b]]).count("1") <= distancia:
                            unir(miembros[a], miembros[b])

    grupos = {}
    for i, f in enumerate(fotos):
        grupos.setdefault(raiz(i), []).append(f)
    return list(grupos.values())


def repartir(ids, proporciones, rng):
    ids = sorted(ids)
    rng.shuffle(ids)
    n = len(ids)
    _, p_val, p_test = proporciones
    n_val, n_test = round(n * p_val), round(n * p_test)
    if n >= 5:
        n_val = max(1, n_val) if p_val else 0
        n_test = max(1, n_test) if p_test else 0

    reparto = {}
    for i, identificador in enumerate(ids):
        if i < n_test:
            reparto[identificador] = "prueba"
        elif i < n_test + n_val:
            reparto[identificador] = "validacion"
        else:
            reparto[identificador] = "entrenamiento"
    return reparto


def preparar(minimo=20, similitud=6, renovar_prueba=False, registrar=print):
    """Devuelve (tabla de fotos con su partición, lista de avisos)."""
    fotos, invalidas = escanear()
    unicas, repetidas, en_conflicto = quitar_repetidas(fotos)

    for ruta in invalidas:
        registrar(f"⚠️  No se pudo abrir (se ignora): {ruta.name}")
    for f in repetidas:
        registrar(f"⚠️  Foto repetida (se ignora): {f['ruta'].name}")
    for f in en_conflicto:
        registrar(f"⚠️  La misma foto está en dos levels distintos (se excluye): {f['ruta'].name}")

    conteo = {n: sum(1 for f in unicas if f["nivel"] == n) for n in config.NIVELES}
    registrar("Fotos por level: " + " · ".join(f"{n}: {c}" for n, c in conteo.items()))
    pocos = [n for n, c in conteo.items() if c < minimo]
    if pocos:
        raise DatosInsuficientes(
            f"Faltan fotos en {', '.join(f'level {n}' for n in pocos)} (mínimo {minimo} por level). "
            "Clasifica más fotos en la pestaña Etiquetar."
        )

    # Se respeta el reparto anterior: las fotos ya vistas conservan su partición
    previo_hash = {}
    if config.MANIFIESTO.exists():
        anterior = pd.read_csv(config.MANIFIESTO)
        previo_hash = dict(zip(anterior["hash"], anterior["particion"]))

    primera_vez = not previo_hash
    proporciones = (0.70, 0.15, 0.15) if (primera_vez or renovar_prueba) else (0.85, 0.15, 0.0)
    rng = random.Random(config.SEMILLA)

    grupos = construir_grupos(unicas, similitud, registrar)
    juntas = sum(1 for g in grupos if len(g) > 1)
    registrar(f"Grupos de fotos: {len(grupos)} ({juntas} con fotos casi iguales que se mantienen juntas)")

    particion, etiqueta_grupo, nuevos = {}, {}, []
    for idx, g in enumerate(grupos):
        for f in g:
            etiqueta_grupo[f["hash"]] = f"g{idx:05d}"
        conocidas = {previo_hash[f["hash"]] for f in g if f["hash"] in previo_hash}
        if len(conocidas) > 1:
            registrar(f"⚠️  Fotos casi iguales repartidas en {', '.join(sorted(conocidas))}: {g[0]['ruta'].name}")
        if conocidas:
            elegida = min(conocidas, key=lambda p: PRIORIDAD.index(p) if p in PRIORIDAD else 99)
            for f in g:
                particion[f["hash"]] = previo_hash.get(f["hash"], elegida)
        else:
            nuevos.append(idx)

    for nivel in config.NIVELES:
        ids = []
        for idx in nuevos:
            niveles = [f["nivel"] for f in grupos[idx]]
            if max(set(niveles), key=niveles.count) == nivel:
                ids.append(idx)
        reparto = repartir(ids, proporciones, rng)
        for idx in ids:
            for f in grupos[idx]:
                particion[f["hash"]] = reparto[idx]

    df = pd.DataFrame(
        [
            {
                "ruta": f["ruta"].relative_to(config.RAIZ).as_posix(),
                "nivel": f["nivel"],
                "hash": f["hash"],
                "grupo": etiqueta_grupo[f["hash"]],
                "particion": particion[f["hash"]],
            }
            for f in unicas
        ]
    )
    for p in ("validacion", "prueba"):
        if (df["particion"] == p).sum() == 0:
            raise DatosInsuficientes(f"No hay fotos de {p}. Clasifica más fotos en la pestaña Etiquetar.")
    df.to_csv(config.MANIFIESTO, index=False)

    tabla = pd.crosstab(df["nivel"], df["particion"]).reindex(
        index=config.NIVELES, columns=list(PARTICIONES), fill_value=0
    )
    registrar("Reparto de fotos (entrenamiento / validación / prueba):")
    for n in config.NIVELES:
        registrar(f"   level {n}: {tabla.loc[n, 'entrenamiento']} / {tabla.loc[n, 'validacion']} / {tabla.loc[n, 'prueba']}")

    avisos = []
    for n in config.NIVELES:
        if tabla.loc[n, "prueba"] < 5:
            avisos.append(f"Level {n}: solo {tabla.loc[n, 'prueba']} fotos de prueba, su resultado no será confiable.")
    if not primera_vez and not renovar_prueba:
        registrar("ℹ️  La prueba se mantiene congelada: las fotos nuevas solo van a entrenamiento y validación.")
    return df, avisos