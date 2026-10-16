<div align="center">

# 🍌 Sistema Inteligente de Detección de Sigatoka Negra en Banano

**Sistema de apoyo para la detección, registro y seguimiento de enfermedades en cultivos de banano mediante inteligencia artificial.**

![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=20232A)
![Supabase](https://img.shields.io/badge/Database-Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Python](https://img.shields.io/badge/IA-Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![CNN](https://img.shields.io/badge/Modelo-CNN-6C5CE7?style=for-the-badge)

</div>

---

## 📌 Descripción

Este proyecto busca desarrollar un sistema que permita analizar imágenes de hojas de banano para apoyar la detección de **Sigatoka negra**, registrar los resultados obtenidos y facilitar el seguimiento de los tratamientos aplicados en los lotes de una hacienda.

La aplicación contempla una interfaz web desarrollada con **React**, el uso de **Supabase** para la gestión de datos y autenticación, y un modelo de inteligencia artificial basado en una **red neuronal convolucional (CNN)** para la clasificación de imágenes.

> **Estado del proyecto:** En desarrollo. Las tecnologías y funcionalidades se implementarán progresivamente.

## 🎯 Objetivo

Desarrollar un sistema de apoyo a la detección de Sigatoka negra en banano mediante el análisis de imágenes con inteligencia artificial, con registro geográfico de los lotes y seguimiento de los tratamientos.

## 🧩 Módulos del sistema

### 1. 👤 Registro de Usuario
- Registro de usuarios: nombre, correo, contraseña y rol.
- Perfil de usuario: edición de datos y cambio de contraseña.
- Asignación de usuario: cambio del rol de una cuenta.
- Gestión de roles: creación y modificación de roles y configuración de permisos.

### 2. 📍 Geolocalización y Registro
- Registro de lotes con nombre, latitud y longitud.

### 3. 🔬 Detección de Enfermedades
- Captura de imágenes desde la cámara o selección desde la galería.
- Envío de imágenes al servidor y clasificación mediante la CNN.
- Registro del resultado: diagnóstico, severidad, lote, ubicación, fecha y usuario.
- Visualización del diagnóstico y porcentaje de precisión del modelo.

### 4. 🌱 Recomendación y Seguimiento de la Planta
- Recomendación de tratamiento según la severidad.
- Registro del tratamiento aplicado: producto, fecha, responsable y observaciones.
- Seguimiento de la planta: mejorando, estable o empeorando.

### 5. 📊 Visualización e Informes
- Visualización de detecciones.
- Historial de sesión.
- Reporte de seguimiento.
- Marcadores en el mapa.
- Zonas afectadas.
- Estadísticas.
- Generación de informes.

## 🛠️ Tecnologías

| Tecnología | Uso previsto |
|---|---|
| React | Interfaz de usuario web |
| Supabase | Autenticación, base de datos PostgreSQL y almacenamiento de imágenes |
| Python | Desarrollo del servicio de procesamiento de imágenes |
| CNN | Clasificación de imágenes mediante el modelo entrenado |
| Git y GitHub | Control de versiones y alojamiento del código |

## 🏗️ Arquitectura general

```text
Usuario
   │
   ▼
Aplicación web (React)
   │
   ├── Supabase Auth ───── Autenticación
   │
   ├── Supabase Database ─ Usuarios, lotes, detecciones y tratamientos
   │
   ├── Supabase Storage ── Imágenes
   │
   └── Servicio de IA (Python)
             │
             ▼
        Modelo CNN
             │
             ▼
      Resultado de clasificación
```

La aplicación web, la base de datos y el servicio de IA se integrarán progresivamente. El modelo CNN deberá estar entrenado y disponible para realizar las clasificaciones.

## 🚀 Instalación y ejecución

### Requisitos previos

- [Node.js](https://nodejs.org/) y npm.
- [Git](https://git-scm.com/).
- Una cuenta de [Supabase](https://supabase.com/) cuando se configure la conexión a la base de datos.
- Python y las dependencias del modelo cuando se implemente el servicio de inteligencia artificial.

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <CARPETA_DEL_PROYECTO>
```

Reemplaza los valores entre `< >` por la URL y el nombre reales de tu repositorio.

### 2. Instalar dependencias del frontend

Desde la carpeta que contiene `package.json`, ejecuta:

```bash
npm install
```

### 3. Iniciar el entorno de desarrollo

```bash
npm run dev
```

Abre en el navegador la dirección local que muestre la terminal. En un proyecto creado con Vite suele ser `http://localhost:5173/`.

> Estos pasos corresponden al frontend React creado con Vite. La configuración de Supabase y del servicio de IA se añadirá cuando estén implementados.

## 🔐 Configuración y seguridad

- Guardar las credenciales de conexión en variables de entorno.
- No subir archivos `.env` ni claves secretas al repositorio.
- Aplicar políticas de seguridad de filas (**RLS**) en las tablas de Supabase.
- No incluir la clave `service_role` de Supabase en el código del navegador.
- Validar los permisos de los usuarios desde un entorno confiable del servidor cuando corresponda.

## 📁 Organización sugerida del frontend

La estructura definitiva dependerá de la implementación, pero puede organizarse por módulos:

```text
src/
├── components/
├── pages/
│   ├── usuarios/
│   ├── lotes/
│   ├── detecciones/
│   ├── seguimiento/
│   └── informes/
├── services/
├── hooks/
├── assets/
├── App.jsx
└── main.jsx
```

## 🗺️ Plan de desarrollo

- [ ] Módulo 1: Registro de Usuario.
- [ ] Módulo 2: Geolocalización y Registro.
- [ ] Módulo 3: Detección de Enfermedades.
- [ ] Módulo 4: Recomendación y Seguimiento de la Planta.
- [ ] Módulo 5: Visualización e Informes.
- [ ] Integración y pruebas del sistema completo.

## ⚠️ Alcance y consideraciones

Los resultados del modelo de inteligencia artificial son una herramienta de apoyo y deben interpretarse de acuerdo con el rendimiento del modelo entrenado. El diagnóstico y las recomendaciones deben validarse con criterios técnicos agrícolas antes de tomar decisiones de manejo del cultivo.

## 👨‍💻 Desarrollo

Proyecto académico en desarrollo. La implementación se realizará progresivamente, módulo por módulo, procurando mantener una estructura clara y facilitar la integración de sus componentes.

---

<div align="center">

**🍃 Tecnología e inteligencia artificial al servicio del cultivo de banano.**

</div>
