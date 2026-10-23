"""Pestaña Versiones: historial de entrenamientos. Aquí se activa la versión que usará la app."""
import os
import queue
import threading
import tkinter as tk
from tkinter import messagebox, ttk

from PIL import Image, ImageTk

from conexion import backend
from nucleo import config, versiones

COLUMNAS = (
    ("version", "Versión", 80),
    ("fecha", "Fecha", 125),
    ("cnn", "CNN", 110),
    ("exacto", "Exacto", 70),
    ("mas1", "±1 level", 70),
    ("trat", "Tratamiento", 90),
    ("f1", "F1", 60),
    ("umbral", "Umbral", 65),
    ("prueba", "Fotos prueba", 90),
    ("backend", "Backend", 115),
)


class PestanaVersiones(ttk.Frame):
    def __init__(self, padre):
        super().__init__(padre, padding=12)
        self.imagen_tk = None
        self._construir()
        self.recargar()
        self.winfo_toplevel().bind("<<VersionesCambiaron>>", lambda e: self.recargar(), add="+")

    def _construir(self):
        self.columnconfigure(0, weight=1)
        self.rowconfigure(0, weight=1)

        marco = ttk.Frame(self)
        marco.grid(row=0, column=0, sticky="nsew")
        marco.columnconfigure(0, weight=1)
        marco.rowconfigure(0, weight=1)
        self.arbol = ttk.Treeview(marco, columns=[c[0] for c in COLUMNAS], show="headings", selectmode="browse", height=8)
        for clave, titulo, ancho in COLUMNAS:
            self.arbol.heading(clave, text=titulo)
            self.arbol.column(clave, width=ancho, anchor="w" if clave in ("version", "fecha", "cnn") else "center")
        self.arbol.tag_configure("activa", background="#dcfce7")
        self.arbol.grid(row=0, column=0, sticky="nsew")
        scroll = ttk.Scrollbar(marco, command=self.arbol.yview)
        scroll.grid(row=0, column=1, sticky="ns")
        self.arbol.config(yscrollcommand=scroll.set)
        self.arbol.bind("<<TreeviewSelect>>", lambda e: self._mostrar_detalle())

        botones = ttk.Frame(self)
        botones.grid(row=1, column=0, sticky="ew", pady=8)
        for texto, comando in (
            ("✔ Activar esta versión", self.activar),
            ("Reenviar al backend", self.reenviar),
            ("Reenviar todas las pendientes", self.reenviar_pendientes),
            ("📂 Abrir carpeta", self.abrir_carpeta),
        ):
            ttk.Button(botones, text=texto, command=comando).pack(side="left", padx=(0, 6))
        self.lbl_estado = ttk.Label(botones, text="", foreground="#475569")
        self.lbl_estado.pack(side="left", padx=10)

        detalle = ttk.Frame(self)
        detalle.grid(row=2, column=0, sticky="nsew")
        detalle.columnconfigure(0, weight=1)
        self.rowconfigure(2, weight=2)
        self.txt_detalle = tk.Text(detalle, width=60, height=14, wrap="word", state="disabled", bg="#f8fafc", font=("Segoe UI", 10))
        self.txt_detalle.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        self.lbl_matriz = ttk.Label(detalle)
        self.lbl_matriz.grid(row=0, column=1, sticky="n")

    # ---------- datos ----------
    def recargar(self):
        seleccion = self.arbol.selection()
        self.arbol.delete(*self.arbol.get_children())
        activa = versiones.activa()
        for fila in reversed(versiones.listar()):
            v, c, m = fila["version"], fila["config"], fila["metricas"]["prueba"]
            enviado = versiones.estado_backend(v).get("enviado")
            self.arbol.insert(
                "", "end", iid=v, tags=("activa",) if v == activa else (),
                values=(
                    ("▶ " if v == activa else "") + v, c["creada_en"][:16].replace("T", " "), c["cnn"],
                    f"{m['acierto_exacto']:.1%}", f"{m['acierto_mas_menos_1']:.1%}", f"{m['acierto_tratamiento']:.1%}",
                    f"{m['f1_macro']:.3f}", f"{c['umbral_confianza']:.2f}", c["fotos"]["prueba"],
                    "✔ enviado" if enviado else "⏳ pendiente",
                ),
            )
        if seleccion and self.arbol.exists(seleccion[0]):
            self.arbol.selection_set(seleccion[0])
        self._mostrar_detalle()

    def _version(self):
        seleccion = self.arbol.selection()
        return seleccion[0] if seleccion else None

    def _mostrar_detalle(self):
        version = self._version()
        self.txt_detalle.config(state="normal")
        self.txt_detalle.delete("1.0", "end")
        self.lbl_matriz.config(image="")
        if version:
            carpeta = versiones.carpeta_de(version)
            c, mt = versiones.leer(carpeta / "config.json"), versiones.leer(carpeta / "metricas.json")
            m, u = mt["prueba"], mt["prueba_con_umbral"]
            f = c["fotos"]
            lineas = [
                f"Versión {version} · CNN {c['cnn']} + SVM (un solo modelo) · ajuste fino: {'sí' if c.get('ajuste_fino') else 'no'}",
                f"Fotos: entrenamiento {f['entrenamiento']} · validación {f['validacion']} · prueba {f['prueba']}",
                "",
                f"Acierto exacto: {m['acierto_exacto']:.1%} · ±1 level: {m['acierto_mas_menos_1']:.1%} · tratamiento: {m['acierto_tratamiento']:.1%}",
                f"Enfermas dadas por sanas: {m['enfermas_dadas_por_sanas']} de {m['total_enfermas']}",
                f"Sanas dadas por enfermas: {m['sanas_dadas_por_enfermas']} de {m['total_sanas']}",
                "",
                f"Umbral {c['umbral_confianza']:.2f}: responde el {u['cobertura']:.0%} de las fotos",
            ]
            if "acierto_exacto" in u:
                lineas.append(f"   acierto exacto de las respondidas: {u['acierto_exacto']:.1%}")
            if c.get("notas"):
                lineas += ["", f"Notas: {c['notas']}"]
            lineas += ["", "Backend: " + versiones.estado_backend(version).get("mensaje", "")]
            self.txt_detalle.insert("end", "\n".join(lineas))

            imagen = carpeta / "matriz_confusion.png"
            if imagen.exists():
                with Image.open(imagen) as img:
                    img.thumbnail((420, 360))
                    self.imagen_tk = ImageTk.PhotoImage(img.copy())
                self.lbl_matriz.config(image=self.imagen_tk)
        self.txt_detalle.config(state="disabled")

    # ---------- acciones ----------
    def _en_segundo_plano(self, funcion, al_terminar):
        resultado = queue.Queue()
        threading.Thread(target=lambda: resultado.put(funcion()), daemon=True).start()

        def revisar():
            try:
                valor = resultado.get_nowait()
            except queue.Empty:
                self.after(150, revisar)
                return
            al_terminar(valor)

        self.after(150, revisar)

    def activar(self):
        version = self._version()
        if not version:
            messagebox.showinfo("Versiones", "Elige primero una versión de la lista.")
            return
        versiones.activar(version)
        self.lbl_estado.config(text=f"{version} activada. Avisando al backend...")
        self.recargar()

        def terminado(r):
            self.lbl_estado.config(text=f"{version} activada · backend: {r[1]}")
            self.recargar()

        self._en_segundo_plano(lambda: backend.enviar_version(version), terminado)

    def reenviar(self):
        version = self._version()
        if not version:
            messagebox.showinfo("Versiones", "Elige primero una versión de la lista.")
            return
        self.lbl_estado.config(text="Enviando...")

        def terminado(r):
            self.lbl_estado.config(text=f"{version}: {r[1]}")
            self.recargar()

        self._en_segundo_plano(lambda: backend.enviar_version(version), terminado)

    def reenviar_pendientes(self):
        self.lbl_estado.config(text="Enviando pendientes...")

        def terminado(r):
            self.lbl_estado.config(text=f"Enviadas: {r[0]} · siguen pendientes: {r[1]}")
            self.recargar()

        self._en_segundo_plano(backend.reenviar_pendientes, terminado)

    def abrir_carpeta(self):
        version = self._version()
        carpeta = versiones.carpeta_de(version) if version else config.VERSIONES
        try:
            os.startfile(carpeta)
        except (AttributeError, OSError):
            messagebox.showinfo("Carpeta", str(carpeta))