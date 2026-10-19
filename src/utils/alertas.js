import Swal from "sweetalert2";

const VERDE = "#047857";
const ROJO = "#dc2626";

// Aviso pequeño en la esquina que desaparece solo
const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener("mouseenter", Swal.stopTimer);
    el.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export const alertaOk = (titulo, texto) => toast.fire({ icon: "success", title: titulo, text: texto });

export const alertaError = (titulo, texto) => toast.fire({ icon: "error", title: titulo, text: texto });

export const alertaInfo = (titulo, texto) => toast.fire({ icon: "info", title: titulo, text: texto });

// Ventana de confirmación. Devuelve true si el usuario acepta
export async function confirmar({
  titulo,
  texto,
  textoConfirmar = "Sí, continuar",
  textoCancelar = "Cancelar",
  peligro = false,
}) {
  const r = await Swal.fire({
    icon: peligro ? "warning" : "question",
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: textoCancelar,
    confirmButtonColor: peligro ? ROJO : VERDE,
    cancelButtonColor: "#94a3b8",
    reverseButtons: true,
    focusCancel: true,
  });
  return r.isConfirmed;
}