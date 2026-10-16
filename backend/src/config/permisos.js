// Catálogo de permisos del sistema (clave -> descripción)
export const PERMISOS = {
  "usuarios.ver": "Ver usuarios",
  "usuarios.asignar_rol": "Asignar rol a usuarios",
  "roles.gestionar": "Crear y modificar roles",
  "lotes.ver": "Ver lotes",
  "lotes.crear": "Registrar lotes",
  "detecciones.crear": "Realizar detecciones",
  "detecciones.ver": "Ver detecciones",
  "tratamientos.registrar": "Registrar tratamientos",
  "informes.ver": "Ver informes y estadísticas",
};

// Permisos con los que nace el rol "tecnico"
export const PERMISOS_TECNICO = [
  "lotes.ver",
  "detecciones.crear",
  "detecciones.ver",
  "tratamientos.registrar",
  "informes.ver",
];