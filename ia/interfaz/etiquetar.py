"""Pestaña de etiquetado: elegir la carpeta del dataset y clasificar cada foto de level 0 a 6."""
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from PIL import Image, ImageOps, ImageTk

from nucleo import config
from nucleo.dataset import guardar_ajustes, leer_ajustes

COLOR_NIVEL = {0: "#15803d", 1: "#16a34a", 2: "#d97706", 3: "#ea580c", 4: "#c2410c", 5: "#dc2626", 6: "#991b1b"}
GRUPOS = (("Sana · sin tratamiento", (0, 1)), ("Cirugía", (2, 3, 4)), ("Deshoje", (5, 6)))


def cargar_vista(ruta, maximo=1800):
    """Abre la foto lista para mostrar (corrige la rotación del celular y la reduce)."""
    with Image.open(ruta) as img:
        img.draft("RGB", (maximo, maximo))  # acelera la lectura de fotos JPEG grandes
        imagen = ImageOps.exif_transpose(img).convert("RGB")
    imagen.thumbnail((maximo, maximo), Image.Resampling.LANCZOS)
    return imagen


def acortar(texto, largo=70):
    return texto if len(texto) <= largo else "…" + texto[-(largo - 1):]


class PestanaEtiquetar(ttk.Frame):
    def __init__(self, padre, dataset):
        super().__init__(padre)
        self.dataset = dataset
        self.cola, self.pos = [], 0
        self.actual = None  # (ruta, huella) de la foto en pantalla
        self.imagen = None
        self.foto_tk = None
        self.omitidas = self.repetidas = self.ilegibles = 0
        self._redibujo = None
        self._mensaje = ""
        self.var_subcarpetas = tk.BooleanVar(value=True)

        self._construir()
        self._atajos()
        self._actualizar_contadores()
        self._mostrar_mensaje("Elige la carpeta donde está tu dataset para empezar")

    # ---------- construcción de la pantalla ----------
    def _construir(self):
        self.columnconfigure(0, weight=1)
        self.rowconfigure(1, weight=1)

        barra = ttk.Frame(self, padding=(10, 8))
        barra.grid(row=0, column=0, sticky="ew")
        ttk.Button(barra, text="📁  Elegir carpeta", command=self.elegir_carpeta, takefocus=False).pack(side="left")
        ttk.Checkbutton(
            barra, text="Incluir subcarpetas", variable=self.var_subcarpetas, takefocus=False
        ).pack(side="left", padx=12)
        self.lbl_carpeta = ttk.Label(barra, text="Ninguna carpeta elegida", foreground="#64748b")
        self.lbl_carpeta.pack(side="left", padx=4)
        self.lbl_progreso = ttk.Label(barra, text="", font=("Segoe UI", 10, "bold"))
        self.lbl_progreso.pack(side="right")

        centro = ttk.Frame(self)
        centro.grid(row=1, column=0, sticky="nsew")
        centro.columnconfigure(0, weight=1)
        centro.rowconfigure(0, weight=1)

        self.lienzo = tk.Canvas(centro, bg="#0f172a", highlightthickness=0)
        self.lienzo.grid(row=0, column=0, sticky="nsew", padx=(10, 6), pady=6)
        self.lienzo.bind("<Configure>", self._al_cambiar_tamano)

        lateral = ttk.Frame(centro, padding=(6, 6, 10, 6), width=310)
        lateral.grid(row=0, column=1, sticky="ns")
        lateral.pack_propagate(False)

        ttk.Label(lateral, text="¿En qué level está esta hoja?", font=("Segoe UI", 12, "bold"), wraplength=290).pack(
            anchor="w", pady=(0, 8)
        )

        for titulo, niveles in GRUPOS:
            ttk.Label(lateral, text=titulo, foreground="#475569").pack(anchor="w", pady=(6, 2))
            fila = ttk.Frame(lateral)
            fila.pack(fill="x")
            for n in niveles:
                tk.Button(
                    fila,
                    text=f"Level {n}",
                    bg=COLOR_NIVEL[n],
                    fg="white",
                    activebackground=COLOR_NIVEL[n],
                    activeforeground="white",
                    relief="flat",
                    font=("Segoe UI", 11, "bold"),
                    cursor="hand2",
                    pady=8,
                    takefocus=False,
                    command=lambda nivel=n: self.clasificar(nivel),
                ).pack(side="left", expand=True, fill="x", padx=2)

        acciones = ttk.Frame(lateral)
        acciones.pack(fill="x", pady=(14, 0))
        for texto, comando in (("Omitir", self.omitir), ("Descartar", self.descartar), ("↩ Deshacer", self.deshacer)):
            ttk.Button(acciones, text=texto, command=comando, takefocus=False).pack(
                side="left", expand=True, fill="x", padx=2
            )

        ttk.Label(
            lateral,
            text="Teclas: 0-6 clasifican · Espacio omite · Supr descarta · Retroceso deshace",
            foreground="#64748b",
            wraplength=290,
        ).pack(anchor="w", pady=(8, 0))
        ttk.Label(
            lateral,
            text="Descartar: la foto no es una hoja o está borrosa.",
            foreground="#64748b",
            wraplength=290,
        ).pack(anchor="w", pady=(2, 0))

        ttk.Separator(lateral).pack(fill="x", pady=12)
        ttk.Label(lateral, text="Fotos en el dataset", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(0, 6))

        cuentas = ttk.Frame(lateral)
        cuentas.pack(fill="x")
        cuentas.columnconfigure(1, weight=1)
        self.filas = {}
        for i, n in enumerate(config.NIVELES):
            ttk.Label(cuentas, text=f"Level {n}").grid(row=i, column=0, sticky="w", pady=2)
            barra_n = ttk.Progressbar(cuentas, mode="determinate")
            barra_n.grid(row=i, column=1, sticky="ew", padx=8)
            valor = ttk.Label(cuentas, text="0", width=6, anchor="e")
            valor.grid(row=i, column=2)
            self.filas[n] = (barra_n, valor)

        ttk.Label(cuentas, text="Descartadas").grid(row=7, column=0, sticky="w", pady=(8, 2))
        self.lbl_descartadas = ttk.Label(cuentas, text="0", width=6, anchor="e")
        self.lbl_descartadas.grid(row=7, column=2, pady=(8, 2))
        ttk.Label(cuentas, text="Total", font=("Segoe UI", 10, "bold")).grid(row=8, column=0, sticky="w")
        self.lbl_total = ttk.Label(cuentas, text="0", width=6, anchor="e", font=("Segoe UI", 10, "bold"))
        self.lbl_total.grid(row=8, column=2)

        self.lbl_estado = ttk.Label(self, text="", foreground="#475569", padding=(10, 4))
        self.lbl_estado.grid(row=2, column=0, sticky="ew")

    def _atajos(self):
        ventana = self.winfo_toplevel()
        ventana.bind("<Key>", self._tecla, add="+")
        ventana.bind("<Control-z>", lambda e: self.deshacer() if self.winfo_viewable() else None, add="+")

    def _tecla(self, e):
        if not self.winfo_viewable() or isinstance(self.focus_get(), (tk.Entry, ttk.Entry, tk.Text)):
            return
        if e.char and e.char in "0123456":
            self.clasificar(int(e.char))
        elif e.keysym in ("space", "Right"):
            self.omitir()
        elif e.keysym == "BackSpace":
            self.deshacer()
        elif e.keysym == "Delete":
            self.descartar()

    # ---------- carpeta ----------
    def elegir_carpeta(self):
        ajustes = leer_ajustes()
        carpeta = filedialog.askdirectory(
            title="Elige la carpeta con las fotos del dataset",
            initialdir=ajustes.get("ultima_carpeta") or str(config.RAIZ),
            mustexist=True,
        )
        self.lienzo.focus_set()
        if not carpeta:
            return
        guardar_ajustes({**ajustes, "ultima_carpeta": carpeta})
        self.cargar_carpeta(carpeta)

    def cargar_carpeta(self, carpeta):
        try:
            fotos = self.dataset.listar_fotos(carpeta, self.var_subcarpetas.get())
        except OSError as error:
            messagebox.showerror("No se pudo leer la carpeta", str(error))
            return

        self.cola, self.pos = fotos, 0
        self.omitidas = self.repetidas = self.ilegibles = 0
        self.lbl_carpeta.config(text=acortar(str(carpeta)))
        self._estado(f"{len(fotos)} fotos encontradas")

        if not fotos:
            self.actual = None
            self._mostrar_mensaje("No se encontraron fotos en esa carpeta")
            self._actualizar_progreso()
            return
        self._mostrar_actual()

    # ---------- mostrar la foto ----------
    def _mostrar_actual(self):
        while self.pos < len(self.cola):
            ruta = self.cola[self.pos]
            try:
                huella = self.dataset.hash_de(ruta)
            except OSError:
                self.ilegibles += 1
                self.pos += 1
                continue

            if self.dataset.etiqueta_de(huella):  # esta foto ya está en el dataset (o fue descartada)
                self.repetidas += 1
                self.pos += 1
                continue

            try:
                self.imagen = cargar_vista(ruta)
            except Exception:
                self.ilegibles += 1
                self.pos += 1
                continue

            self.actual = (ruta, huella)
            self._dibujar()
            self._actualizar_progreso()
            return

        self.actual = None
        self._mostrar_mensaje(self._resumen_final())
        self._actualizar_progreso()

    def _resumen_final(self):
        lineas = ["✅ No quedan fotos por clasificar en esta carpeta"]
        if self.omitidas:
            lineas.append(f"{self.omitidas} omitidas (vuelven a aparecer si eliges la carpeta otra vez)")
        if self.repetidas:
            lineas.append(f"{self.repetidas} ya estaban clasificadas o descartadas")
        if self.ilegibles:
            lineas.append(f"{self.ilegibles} no se pudieron abrir")
        lineas.append("Para agregar más fotos, elige otra carpeta")
        return "\n\n".join(lineas)

    def _mostrar_mensaje(self, texto):
        self._mensaje = texto
        self.imagen = None
        self._dibujar()

    def _dibujar(self):
        self.lienzo.delete("all")
        ancho, alto = self.lienzo.winfo_width(), self.lienzo.winfo_height()
        if ancho < 10 or alto < 10:
            return
        if self.imagen is not None:
            vista = ImageOps.contain(self.imagen, (ancho - 8, alto - 8), Image.Resampling.LANCZOS)
            self.foto_tk = ImageTk.PhotoImage(vista)
            self.lienzo.create_image(ancho // 2, alto // 2, image=self.foto_tk)
        else:
            self.lienzo.create_text(
                ancho // 2,
                alto // 2,
                text=self._mensaje,
                fill="#e2e8f0",
                font=("Segoe UI", 14),
                justify="center",
                width=max(ancho - 80, 100),
            )

    def _al_cambiar_tamano(self, _):
        if self._redibujo:
            self.after_cancel(self._redibujo)
        self._redibujo = self.after(80, self._dibujar)

    # ---------- acciones ----------
    def clasificar(self, nivel):
        if not self.actual:
            return
        ruta, huella = self.actual
        try:
            self.dataset.clasificar(ruta, nivel, huella)
        except OSError as error:
            messagebox.showerror("No se pudo guardar la foto", str(error))
            return
        self._estado(f"Guardada en level {nivel}")
        self._avanzar()

    def omitir(self):
        if not self.actual:
            return
        self.omitidas += 1
        self._estado("Foto omitida")
        self._avanzar()

    def descartar(self):
        if not self.actual:
            return
        ruta, huella = self.actual
        try:
            self.dataset.descartar(ruta, huella)
        except OSError as error:
            messagebox.showerror("No se pudo descartar la foto", str(error))
            return
        self._estado("Foto descartada")
        self._avanzar()

    def deshacer(self):
        accion = self.dataset.deshacer()
        if not accion:
            self._estado("No hay nada que deshacer")
            return
        self.cola.insert(self.pos, accion.original)  # la foto vuelve a mostrarse
        self._estado(f"Deshecho: {accion.original.name} vuelve a la cola")
        self._actualizar_contadores()
        self._mostrar_actual()

    def _avanzar(self):
        self.pos += 1
        self._actualizar_contadores()
        self._mostrar_actual()

    # ---------- indicadores ----------
    def _estado(self, texto):
        self.lbl_estado.config(text=texto)

    def _actualizar_progreso(self):
        if self.cola:
            restantes = max(len(self.cola) - self.pos, 0)
            self.lbl_progreso.config(text=f"Quedan {restantes} de {len(self.cola)} en esta carpeta")
        else:
            self.lbl_progreso.config(text="")

    def _actualizar_contadores(self):
        conteos = self.dataset.conteos
        mayor = max(max(conteos.values()), 1)
        for n, (barra, valor) in self.filas.items():
            barra.config(maximum=mayor, value=conteos[n])
            valor.config(text=str(conteos[n]))
        self.lbl_descartadas.config(text=str(self.dataset.descartadas))
        self.lbl_total.config(text=str(self.dataset.total))