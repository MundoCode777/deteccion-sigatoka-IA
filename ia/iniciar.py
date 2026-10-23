"""Abre el Centro de IA.  Desde la carpeta ia/:  python iniciar.py"""
import sys
from pathlib import Path

# Permite ejecutarlo desde cualquier carpeta
sys.path.insert(0, str(Path(__file__).resolve().parent))

from interfaz.ventana import Aplicacion

if __name__ == "__main__":
    try:  # imagen nítida en pantallas con escala de Windows
        import ctypes

        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        pass
    Aplicacion().mainloop()