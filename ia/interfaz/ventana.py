"""Ventana principal del Centro de IA."""
import tkinter as tk
from tkinter import ttk

from nucleo.dataset import Dataset

from .entrenar import PestanaEntrenar
from .etiquetar import PestanaEtiquetar
from .versiones import PestanaVersiones


class Aplicacion(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Sigatoka Negra · Centro de IA")
        self.geometry("1240x780")
        self.minsize(1000, 660)

        self.dataset = Dataset()
        self.pestanas = ttk.Notebook(self)
        self.pestanas.pack(fill="both", expand=True)

        self.etiquetar = PestanaEtiquetar(self.pestanas, self.dataset)
        self.entrenar = PestanaEntrenar(self.pestanas, self.dataset)
        self.versiones = PestanaVersiones(self.pestanas)
        self.pestanas.add(self.etiquetar, text="  Etiquetar  ")
        self.pestanas.add(self.entrenar, text="  Entrenar  ")
        self.pestanas.add(self.versiones, text="  Versiones  ")

        # Mientras se entrena no se puede etiquetar, para que las fotos no cambien a mitad del entrenamiento
        self.bind("<<EntrenamientoInicio>>", lambda e: self.pestanas.tab(0, state="disabled"))
        self.bind("<<EntrenamientoFin>>", lambda e: self.pestanas.tab(0, state="normal"))
        self.pestanas.bind("<<NotebookTabChanged>>", self._al_cambiar_pestana)

    def _al_cambiar_pestana(self, _):
        actual = self.pestanas.nametowidget(self.pestanas.select())
        if actual is self.entrenar:
            self.entrenar.actualizar_conteos()
        elif actual is self.versiones:
            self.versiones.recargar()