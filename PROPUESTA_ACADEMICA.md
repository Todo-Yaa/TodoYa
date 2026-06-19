# Sustentación Académica y Propuesta Técnica — Todo Ya 🚀

Este documento detalla la fundamentación académica, la pertinencia y la sustentación técnica del proyecto **Todo Ya** para ser adjuntado como soporte al prototipo desarrollado.

---

## 📋 Resumen Ejecutivo del Prototipo
**Todo Ya** es una plataforma móvil universal y web (desarrollada con **React Native, Expo, Drizzle ORM, Neon.db e i18n**) que conecta clientes con proveedores de servicios generales en tiempo real. Dispone de dos flujos separados y optimizados:
1. **Residencial (B2C):** Búsqueda inmediata de técnicos (plomeros, electricistas, pintores) mediante un radar de 15 segundos y mapas interactivos.
2. **Corporativo (B2B):** Sistema de subastas invertidas y contraofertas progresivas con chat de negociación en vivo para insumos y servicios industriales.

---

## 📐 Fundamentación del Proyecto

### 1. Pertinencia de la propuesta en respuesta a necesidades de la empresa y la sociedad

*   **En la Sociedad (Segmento Residencial):**
    El sector de los servicios generales y de reparaciones del hogar en América Latina sufre de una alta **informalidad, desconfianza y falta de estándares tarifarios**. Los clientes residenciales se exponen a riesgos de seguridad al ingresar desconocidos a sus hogares y a cobros arbitrarios por falta de transparencia. **Todo Ya** responde a esto digitalizando la reputación del técnico (índice de veracidad, historial de trabajos y feedback verificado). Su sistema de **Calificación Forzada con Bloqueo** a nivel raíz impide que los servicios queden sin calificar, protegiendo a la comunidad y auto-regulando el mercado.
*   **En la Empresa (Segmento Corporativo B2B):**
    Las micro, pequeñas y medianas empresas (MiPyMEs) pierden días cotizando materiales e insumos comerciales de forma tradicional. **Todo Ya** responde a esta ineficiencia implementando un **Motor de Licitaciones en Vivo** y subastas, permitiendo que múltiples empresas proveedoras postulen cotizaciones y realicen contraofertas en minutos. El canal de **Chat de Negociación** permite concertar detalles clave (NIT para facturación, plazos de entrega y cronogramas) antes de cerrar el contrato, optimizando la cadena de suministro.

---

### 2. Grado de innovación y originalidad

*   **Motor NLP IA Simulado:** A diferencia de los buscadores por categorías rígidos, la plataforma analiza la descripción textual libre escrita por el cliente para clasificar de forma autónoma el servicio, estimar un costo sugerido y definir la urgencia del trabajo.
*   **Modelo de Contraofertas Adaptativas B2B:** Introduce flexibilidad en el mercado B2B, permitiendo a los proveedores competir no solo a la baja de precios, sino también ofreciendo servicios con valor agregado (garantías premium, insumos de mayor calidad) al alza, rompiendo el esquema clásico de precios estáticos.
*   **Diseño Inclusivo y i18n Multicultural:** Implementa traducción en tiempo real a **5 idiomas**, incluyendo 3 lenguas originarias de Bolivia: **Español, Inglés, Quechua, Aymara y Guaraní**. Esto representa una originalidad absoluta en aplicaciones de servicios locales, fomentando la inclusión digital de sectores vulnerables y respetando la identidad cultural.

---

### 3. Impacto social y/o técnico

*   **Impacto Social:**
    *   **Inclusión Laboral y Financiera:** Proporciona a plomeros, pintores y electricistas independientes una identidad digital profesional y una herramienta para gestionar sus finanzas y reputación sin depender de intermediarios abusivos.
    *   **Inclusión Idiomática:** Democratiza el acceso a la tecnología al permitir que usuarios que hablan lenguas indígenas interactúen fluidamente con la app.
*   **Impacto Técnico:**
    *   **Desarrollo Multiplataforma Híbrido:** Un único código fuente escrito en TypeScript compila de manera nativa para iOS y Android, y genera una aplicación Web responsive.
    *   **Arquitectura de Servidor Moderna:** Integración de **Expo API Routes** (Backend Serverless) con **Drizzle ORM** y **Neon.db** (PostgreSQL Serverless), permitiendo una base de datos relacional robusta con consultas optimizadas y seguridad a nivel de servidor.
    *   **Navegación e Interfaz Premium:** Transición fluida de roles con micro-animaciones (Reanimated) que cambian el diseño visual de la app según el rol del usuario (Dorado residencial vs. Slate/Índigo para B2B).

---

### 4. Dominio y sustentación de la temática del proyecto

El proyecto demuestra un riguroso dominio de las áreas clave de la ingeniería de software:
*   **Diseño de Arquitectura de Software:** Uso del patrón arquitectónico MVC y arquitectura basada en componentes reactivos y limpios.
*   **Modelado de Datos Relacional:** El esquema de base de datos relacional soporta herencia de perfiles, tipos de entidad (Natural vs. Empresa) y relaciones de clave foránea complejas para el ciclo de vida de las órdenes y postulaciones.
*   **Estado Global Reactivo:** Implementación del patrón de diseño Context API para mantener en sincronía la autenticación, monedas, perfiles y pedidos activos a lo largo de todas las pantallas de navegación.
*   **Seguridad Informática (Auth Guard):** Sistema de seguridad y layouts protegidos que interceptan el acceso si la sesión no es válida, redirigiendo de inmediato al usuario al login social OAuth (Google/LinkedIn) simulado.

---

### 5. Propuesta académica contenida en el proyecto que se adjuntará al prototipado

El prototipo se presenta como un **caso de estudio práctico de Ingeniería de Software Aplicada**, diseñado para enriquecer asignaturas universitarias:
*   **Tesis/Proyecto de Grado:** Sirve como base metodológica para investigar algoritmos de matching geolocalizado y optimización de licitaciones en tiempo real.
*   **Laboratorio de Programación Móvil:** Aporta ejemplos reales de inyección de Iframe HTML dinámico para mapas interactivos (Leaflet.js) en entornos híbridos y animaciones de radar con cálculo trigonométrico.
*   **Ingeniería de Requisitos y Modelado:** Adjunta una documentación exhaustiva de Casos de Uso, Diagramas de Flujo y Modelos Entidad-Relación en Mermaid ([DISENO_LOGICO.md](file:///c:/Users/PCZ/Desktop/todo-ya/DISENO_LOGICO.md)), sirviendo como ejemplo de análisis e ingeniería inversa para estudiantes.

---

## 6. Pertinencia con el área de especialidad de la carrera y/o facultad

Este proyecto se enmarca directamente dentro del perfil de egreso de **Ingeniería de Sistemas, Ingeniería de Software y Ciencias de la Computación** de la Facultad de Tecnología:
*   **Ingeniería de Software:** Aplica metodologías ágiles de desarrollo, control de versiones estricto (Git con flujos de trabajo de ramas/features), type-checking estático con TypeScript y pruebas de usabilidad e interfaz (UX/UI) automatizadas.
*   **Sistemas de Bases de Datos:** Integra Drizzle ORM y base de datos relacionales en la nube, capacitando en el diseño de esquemas, migraciones y queries de alto rendimiento.
*   **Desarrollo Full-Stack:** Obliga al estudiante a dominar tanto el desarrollo de interfaces responsivas y adaptativas (Frontend) como la construcción de APIs seguras y lógica de servidor (Backend).
*   **Responsabilidad Social y Usabilidad:** Enfrenta al ingeniero al reto del diseño accesible, centrado en el usuario, inclusivo y adaptado a las lenguas originarias de su entorno sociodemográfico.
