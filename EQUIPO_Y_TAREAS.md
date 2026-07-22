# 📌 PLAN DE ORGANIZACIÓN Y TAREAS DEL EQUIPO — TODO YA 🚀

Este documento sirve como guía para la organización ágil del equipo de desarrollo de **Todo Ya**.

---

## 👥 Integrantes del Equipo y Roles

| Nombre | Rol Principal | Enfoque de Desarrollo |
| :--- | :--- | :--- |
| **Tú (Project Manager)** | PM & Liderazgo de Arquitectura | Gestión del Proyecto, Vercel, OAuth, Coordinación del Equipo |
| **Socio Fundador 2** | Programador Full-Stack | Base de Datos Neon (PostgreSQL), APIs Serverless, Lógica B2B |
| **Aldair** | Programador Frontend / Móvil | UI/UX de Pantallas, Componentes React Native/Expo, Pruebas |

---

## 📋 Tablero de Tareas Iniciales (Sprint 1)

### 🟢 1. Tareas Asignadas a ALDAIR (Frontend & Experiencia de Usuario)
- [ ] **Tarea 1.1:** Revisar y optimizar la responsividad de las pantallas de `perfil.tsx` y `pperfil.tsx` en pantallas de celulares pequeños.
- [ ] **Tarea 1.2:** Agregar animaciones de transición en los botones del selector de roles en la pantalla principal.
- [ ] **Tarea 1.3:** Crear un modal de ayuda / preguntas frecuentes (FAQ) para clientes residenciales sobre cómo usar el radar.
- [ ] **Tarea 1.4:** Probar el flujo completo de selección y edición de fotos de perfil en dispositivos móviles.

### 🔵 2. Tareas Asignadas a SOCIO FUNDADOR 2 (Backend & Base de Datos)
- [ ] **Tarea 2.1:** Revisar las consultas SQL en Drizzle ORM para asegurar índices rápidos en la tabla de `orders` y `users`.
- [ ] **Tarea 2.2:** Validar el sistema de webhooks/respuestas de la API de pagos Veripagos (`veripagos+api.ts`).
- [ ] **Tarea 2.3:** Implementar sistema de logs de auditoría para rastrear cuando se debitan monedas de los proveedores.
- [ ] **Tarea 2.4:** Verificar la sincronización de mensajes de chat en tiempo real cuando la base de datos Neon está activa.

### 🟡 3. Tareas Asignadas a TI (Project Manager & Integraciones)
- [ ] **Tarea 3.1:** Crear y configurar el tablero de **GitHub Projects** en la organización/repositorio.
- [ ] **Tarea 3.2:** Monitorear los logs de compilación y despliegue continuo en la consola de Vercel.
- [ ] **Tarea 3.3:** Configurar las claves de OAuth2 de Google y LinkedIn en los entornos de Producción.
- [ ] **Tarea 3.4:** Realizar el Daily Check-in con el equipo al final del día para revisar bloqueos.

---

## 🔄 Flujo de Trabajo Diario (Daily Workflow)

1. **Inicio de Jornada (5 min):** Cada desarrollador revisa su columna en el tablero de GitHub Projects y pasa su tarea de `To Do` a `In Progress`.
2. **Durante el Día:** Desarrollar en ramas locales y realizar pruebas con `npx tsc --noEmit`.
3. **Cierre de Jornada (10 min):** Subir commits a GitHub con mensajes descriptivos (`feat: ...` o `fix: ...`) y mover las tareas completadas a la columna `Done`.
