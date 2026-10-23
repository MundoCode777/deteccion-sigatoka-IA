"""Pestaña Entrenar: entrena el modelo híbrido CNN + SVM con las fotos clasificadas."""
import queue
import threading
import tkinter as tk
import traceback
from tkinter import messagebox, ttk

from nucleo import config

CNNS = {"MobileNetV2 (rápida)": "mobilenetv2", "EfficientNetB0 (más precisa, más lenta)": "efficientnetb0"}
MINIMO_POR_NIVEL = 20


class PestanaEntrenar(ttk.Frame):
    def __init__(self, padre, dataset):
        super().__init__(padre)
        self.dataset = dataset
        self.mensajes = queue.Queue()
        self.cancelar = threading.Event()
        self.hilo = None

        self.var_cnn = tk.StringVar(value=next(iter(CNNS)))
        self.var_fino = tk.BooleanVar(value=True)
        self.var_epocas = tk.IntVar(value=12)
        self.var_objetivo = tk.IntVar(value=90)
        self.var_renovar = tk.BooleanVar(value=False)
        self.var_notas = tk.StringVar()

        self._construir()
        self.actualizar_conteos()

    # ---------- pantalla ----------
    def _construir(self):
        self.columnconfigure(1, weight=1)
        self.rowconfigure(0, weight=1)

        izq = ttk.Frame(self, padding=14, width=360)
        izq.grid(row=0, column=0, sticky="ns")
        izq.grid_propagate(False)

        ttk.Label(izq, text="Fotos clasificadas", font=("Segoe UI", 12, "bold")).pack(anchor="w")
        cuentas = ttk.Frame(izq)
        cuentas.pack(fill="x", pady=(6, 0))
        cuentas.columnconfigure(1, weight=1)
        self.lbl_niveles = {}
        for i, n in enumerate(config.NIVELES):
            ttk.Label(cuentas, text=f"Level {n}").grid(row=i, column=0, sticky="w")
            self.lbl_niveles[n] = ttk.Label(cuentas, text="0", anchor="e")
            self.lbl_niveles[n].grid(row=i, column=1, sticky="e")
        self.lbl_total = ttk.Label(cuentas, text="Total: 0", font=("Segoe UI", 10, "bold"))
        self.lbl_total.grid(row=7, column=0, columnspan=2, sticky="w", pady=(6, 0))
        self.lbl_aviso = ttk.Label(izq, text="", wraplength=330)
        self.lbl_aviso.pack(anchor="w", pady=(6, 10))

        opciones = ttk.LabelFrame(izq, text=" Opciones ", padding=10)
        opciones.pack(fill="x")
        ttk.Label(opciones, text="CNN").grid(row=0, column=0, sticky="w", pady=3)
        ttk.Combobox(opciones, textvariable=self.var_cnn, values=list(CNNS), state="readonly", width=34).grid(
            row=0, column=1, sticky="ew", pady=3
        )
        ttk.Checkbutton(
            opciones, text="Ajuste fino de la CNN (más lento, más preciso)", variable=self.var_fino
        ).grid(row=1, column=0, columnspan=2, sticky="w", pady=3)
        ttk.Label(opciones, text="Épocas máximas").grid(row=2, column=0, sticky="w", pady=3)
        ttk.Spinbox(opciones, from_=1, to=60, textvariable=self.var_epocas, width=6).grid(row=2, column=1, sticky="w")
        ttk.Label(opciones, text="Acierto buscado (%)").grid(row=3, column=0, sticky="w", pady=3)
        ttk.Spinbox(opciones, from_=50, to=99, textvariable=self.var_objetivo, width=6).grid(row=3, column=1, sticky="w")
        ttk.Checkbutton(
            opciones, text="Renovar la prueba con las fotos nuevas", variable=self.var_renovar
        ).grid(row=4, column=0, columnspan=2, sticky="w", pady=3)
        ttk.Label(opciones, text="Notas").grid(row=5, column=0, sticky="w", pady=3)
        ttk.Entry(opciones, textvariable=self.var_notas).grid(row=5, column=1, sticky="ew")
        opciones.columnconfigure(1, weight=1)

        botones = ttk.Frame(izq)
        botones.pack(fill="x", pady=12)
        self.btn_entrenar = ttk.Button(botones, text="▶  Entrenar", command=self.entrenar)
        self.btn_entrenar.pack(side="left", expand=True, fill="x", padx=(0, 4))
        self.btn_cancelar = ttk.Button(botones, text="Cancelar", command=self.cancelar.set, state="disabled")
        self.btn_cancelar.pack(side="left", expand=True, fill="x", padx=(4, 0))

        ttk.Label(
            izq,
            text="La CNN y el SVM se entrenan juntos y se guardan como un solo modelo. "
            "El modelo nuevo solo se activa si supera al anterior con las mismas fotos de prueba.",
            wraplength=330,
            foreground="#64748b",
        ).pack(anchor="w")

        der = ttk.Frame(self, padding=(0, 14, 14, 14))
        der.grid(row=0, column=1, sticky="nsew")
        der.columnconfigure(0, weight=1)
        der.rowconfigure(2, weight=1)

        self.lbl_etapa = ttk.Label(der, text="Sin entrenar", font=("Segoe UI", 11, "bold"))
        self.lbl_etapa.grid(row=0, column=0, sticky="w")
        self.barra = ttk.Progressbar(der, maximum=1.0)
        self.barra.grid(row=1, column=0, sticky="ew", pady=6)

        marco_log = ttk.Frame(der)
        marco_log.grid(row=2, column=0, sticky="nsew")
        marco_log.columnconfigure(0, weight=1)
        marco_log.rowconfigure(0, weight=1)
        self.txt_log = tk.Text(marco_log, height=10, wrap="word", state="disabled", bg="#f8fafc", font=("Consolas", 9))
        self.txt_log.grid(row=0, column=0, sticky="nsew")
        scroll = ttk.Scrollbar(marco_log, command=self.txt_log.yview)
        scroll.grid(row=0, column=1, sticky="ns")
        self.txt_log.config(yscrollcommand=scroll.set)

        ttk.Label(der, text="Resultado", font=("Segoe UI", 11, "bold")).grid(row=3, column=0, sticky="w", pady=(10, 4))
        self.txt_resultado = tk.Text(der, height=12, wrap="word", state="disabled", bg="#f0fdf4", font=("Segoe UI", 10))
        self.txt_resultado.grid(row=4, column=0, sticky="ew")

    # ---------- indicadores ----------
    def actualizar_conteos(self):
        conteos = self.dataset.conteos
        for n in config.NIVELES:
            self.lbl_niveles[n].config(text=str(conteos[n]))
        self.lbl_total.config(text=f"Total: {sum(conteos.values())}")
        faltan = [f"level {n}" for n in config.NIVELES if conteos[n] < MINIMO_POR_NIVEL]
        if faltan:
            self.lbl_aviso.config(
                text=f"Faltan fotos en {', '.join(faltan)} (mínimo {MINIMO_POR_NIVEL} por level).", foreground="#b91c1c"
            )
        else:
            self.lbl_aviso.config(text="✔ Hay fotos suficientes para entrenar.", foreground="#15803d")

    @staticmethod
    def _escribir(texto_widget, texto, reemplazar=False):
        texto_widget.config(state="normal")
        if reemplazar:
            texto_widget.delete("1.0", "end")
        texto_widget.insert("end", texto)
        texto_widget.see("end")
        texto_widget.config(state="disabled")

    # ---------- entrenamiento ----------
    def entrenar(self):
        if self.hilo and self.hilo.is_alive():
            return
        try:
            epocas, objetivo = int(self.var_epocas.get()), int(self.var_objetivo.get())
        except (tk.TclError, ValueError):
            messagebox.showwarning("Opciones", "Las épocas y el acierto buscado deben ser números.")
            return
        if not (1 <= epocas <= 60 and 50 <= objetivo <= 99):
            messagebox.showwarning("Opciones", "Épocas: de 1 a 60. Acierto buscado: de 50 a 99.")
            return

        opciones = {
            "cnn": CNNS[self.var_cnn.get()],
            "ajuste_fino": self.var_fino.get(),
            "epocas": epocas,
            "objetivo": objetivo / 100,
            "renovar_prueba": self.var_renovar.get(),
            "minimo": MINIMO_POR_NIVEL,
            "notas": self.var_notas.get().strip(),
        }
        self.cancelar.clear()
        self._escribir(self.txt_log, "", reemplazar=True)
        self._escribir(self.txt_resultado, "", reemplazar=True)
        self.barra.config(value=0)
        self.lbl_etapa.config(text="Iniciando (la primera vez descarga la CNN preentrenada, necesita internet)...")
        self.btn_entrenar.config(state="disabled")
        self.btn_cancelar.config(state="normal")
        self.event_generate("<<EntrenamientoInicio>>")

        self.hilo = threading.Thread(target=self._trabajo, args=(opciones,), daemon=True)
        self.hilo.start()
        self.after(120, self._procesar)

    def _trabajo(self, opciones):
        try:
            from entrenamiento import entrenar as motor  # TensorFlow se carga aquí, no al abrir la ventana
            from entrenamiento.preparar import DatosInsuficientes
            from nucleo.modelo import Cancelado

            try:
                resultado = motor.ejecutar(
                    opciones,
                    registrar=lambda t: self.mensajes.put(("log", t)),
                    avance=lambda f, t="": self.mensajes.put(("avance", (f, t))),
                    cancelado=self.cancelar.is_set,
                )
                self.mensajes.put(("fin", resultado))
            except Cancelado:
                self.mensajes.put(("cancelado", None))
            except DatosInsuficientes as error:
                self.mensajes.put(("error", str(error)))
        except Exception as error:
            self.mensajes.put(("log", traceback.format_exc()))
            self.mensajes.put(("error", f"El entrenamiento falló: {error}"))

    def _procesar(self):
        terminado = False
        while True:
            try:
                tipo, dato = self.mensajes.get_nowait()
            except queue.Empty:
                break
            if tipo == "log":
                self._escribir(self.txt_log, dato + "\n")
            elif tipo == "avance":
                self.barra.config(value=dato[0])
                if dato[1]:
                    self.lbl_etapa.config(text=dato[1])
            elif tipo == "fin":
                self._escribir(self.txt_resultado, self._resumen(dato), reemplazar=True)
                self.lbl_etapa.config(text=f"✅ Listo: versión {dato['version']} en {dato['minutos']:.1f} min")
                terminado = True
            elif tipo == "error":
                self._escribir(self.txt_resultado, "❌ " + dato, reemplazar=True)
                self.lbl_etapa.config(text="No se pudo entrenar")
                terminado = True
            elif tipo == "cancelado":
                self._escribir(self.txt_resultado, "Entrenamiento cancelado. No se guardó ninguna versión.", reemplazar=True)
                self.lbl_etapa.config(text="Cancelado")
                terminado = True

        if terminado:
            self.btn_entrenar.config(state="normal")
            self.btn_cancelar.config(state="disabled")
            self.event_generate("<<EntrenamientoFin>>")
            self.event_generate("<<VersionesCambiaron>>")
            self.actualizar_conteos()
        else:
            self.after(120, self._procesar)

    @staticmethod
    def _resumen(r):
        m, u = r["metricas"], r["con_umbral"]
        lineas = [
            f"Versión {r['version']} · {m['fotos']} fotos de prueba (que el modelo nunca vio)",
            "",
            f"Acierto exacto del level ........ {m['acierto_exacto']:.1%}",
            f"Acierto con margen de ±1 level .. {m['acierto_mas_menos_1']:.1%}",
            f"Acierto del tratamiento ......... {m['acierto_tratamiento']:.1%}",
            f"Enfermas dadas por sanas ........ {m['enfermas_dadas_por_sanas']} de {m['total_enfermas']}",
            f"Sanas dadas por enfermas ........ {m['sanas_dadas_por_enfermas']} de {m['total_sanas']}",
            "",
            f"Umbral de confianza {r['umbral']:.2f}: responde el {u['cobertura']:.0%} de las fotos",
        ]
        if "acierto_exacto" in u:
            lineas.append(f"   acierto exacto de las respondidas ... {u['acierto_exacto']:.1%}")
            lineas.append(f"   acierto del tratamiento ............. {u['acierto_tratamiento']:.1%}")
        lineas += [
            "",
            ("▶ Versión activada: " if r["activada"] else "⏸ ") + r["motivo"],
            ("✔ " if r["backend_ok"] else "⏳ ") + "Backend: " + r["backend_mensaje"]
            + ("" if r["backend_ok"] else " (queda pendiente; se reenvía desde la pestaña Versiones)"),
        ]
        for aviso in r["avisos"]:
            lineas.append("⚠️  " + aviso)
        return "\n".join(lineas)