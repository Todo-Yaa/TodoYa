# 🏗️ Estructura Completa del Proyecto — Todo Ya

Este documento contiene la **estructura de software, carpetas, base de datos, distribución de roles y mejoras estratégicas de costo $0** preparada para el desarrollo y despliegue del proyecto **Todo Ya** y su **Panel de Administración**.

---

## 1. 📁 Estructura de Carpetas del Proyecto (Directory Tree)

```text
todo-ya/
├── package.json                         # Dependencias y scripts npm (Expo 56, Drizzle, React 19)
├── app.json                         # Configuración de Expo y API Routes (Serverless)
├── drizzle.config.ts                # Configuración del ORM Drizzle para Neon Postgres
├── tsconfig.json                    # Configuración global de TypeScript 6.0
│
├── assets/                          # Recursos gráficos (iconos, splash, imágenes)
│
└── src/
    ├── db/                          # 🗄️ CAPA DE BASE DE DATOS (NEON POSTGRES + DRIZZLE)
    │   ├── index.ts                 # Conexión HTTP Serverless a Neon.db
    │   └── schema.ts                # Tablas: users, orders, messages, transactions, ratings, applications, reports, admin_audit_logs, system_settings, referrals
    │
    ├── context/                     # 🔑 ESTADO GLOBAL Y SESIÓN DE USUARIO
    │   └── user-context.tsx         # Gestión de login, roles (client, provider, business, admin) y almacenamiento seguro
    │
    ├── services/                    # 🧠 LÓGICA DE NEGOCIO E INTELIGENCIA ARTIFICIAL
    │   ├── ai-matching.ts           # Coincidencia semántica de proveedores con Google Gemini
    │   ├── transcribe.ts            # Transcripción de audios de voz a texto
    │   └── kyc-verification.ts      # Análisis de documentos de identidad con IA
    │
    ├── utils/                       # 🛠️ UTILIDADES Y ALMACENAMIENTO HÍBRIDO
    │   └── storage.ts               # SecureStore en nativo / LocalStorage en Web
    │
    ├── components/                  # 🧩 COMPONENTES REUTILIZABLES DE UI
    │   ├── map-view.tsx             # Componente híbrido de mapas (Leaflet / Radar)
    │   ├── ui/                      # Botones, modals, inputs, tarjetas de servicio
    │   └── admin/                   # Componentes del Panel Admin (Tablas, Filtros, Visor KYC)
    │
    └── app/                         # 📱 PANTALLAS (EXPO ROUTER) & API BACKEND
        ├── _layout.tsx              # Splash animado e inicialización i18n
        ├── index.tsx                # Pantalla principal (Cliente/Empresa)
        ├── solicitar.tsx            # Formulario de Solicitudes con IA Gemini
        ├── leads.tsx                # Bandeja de postulaciones de técnicos y monedas
        ├── pedidos.tsx              # Historial de pedidos activos y completados
        ├── perfil.tsx               # Ajustes e idioma (Quechua, Aymara, Guaraní, ES, EN)
        ├── pperfil.tsx              # Dashboard del proveedor con insignia Premium
        │
        ├── admin/                   # 🖥️ PANEL DE ADMINISTRACIÓN (SUPER ADMINS)
        │   ├── _layout.tsx          # Layout con Sidebar y Verificación de Rol Admin
        │   ├── index.tsx            # Dashboard Principal (KPIs y Métricas Globales)
        │   ├── usuarios.tsx         # Gestión e inspección de usuarios (Cliente/Técnico/Empresa)
        │   ├── kyc.tsx              # Visor y aprobación manual de documentos KYC
        │   ├── denuncias.tsx        # Moderación de reportes y solicitudes de baneo
        │   ├── finanzas.tsx         # Control de recargas de monedas, Culqi y BCP
        │   └── auditoria.tsx        # Historial de acciones de los administradores
        │
        └── api/                     # ⚡ ENDPOINTS BACKEND SERVERLESS
            ├── auth/                # Endpoints de login y refresco de token JWT
            ├── db-status+api.ts     # Chequeo de salud de Neon.db
            ├── matching+api.ts      # Endpoint de búsqueda semántica IA Gemini
            ├── reports+api.ts       # Registro y resolución de denuncias
            ├── users+api.ts         # Modificación de usuarios y estado de cuenta
            ├── payments/            # Endpoints de integración con Culqi y BCP
            └── admin/               # Endpoints REST protegidos para el Panel Admin
```

---

## 2. ⚡ Arquitectura de Software y Flujo de Datos

```mermaid
graph TD
    subgraph Frontend (Cliente Multiplataforma)
        AppMob[App Móvil iOS / Android]
        AppWeb[App Web PWA]
        AdminWeb[Panel Admin Web /src/app/admin]
    end

    subgraph Backend Serverless (Expo API Routes / Node.js)
        Auth[Auth Middleware RBAC]
        UsersAPI[/api/users]
        MatchingAPI[/api/matching]
        PaymentsAPI[/api/payments]
        AdminAPI[/api/admin]
        Drizzle[Drizzle ORM]
    end

    subgraph Infraestructura Nube (Costo $0 inicial)
        Gemini[Google Gemini 2.5 Flash API]
        NeonDB[(Neon.db PostgreSQL Serverless)]
        Culqi[Culqi API v2 - Payments]
        BCP[BCP Crece - Pagos QR]
    end

    AppMob & AppWeb --> Auth
    AdminWeb --> Auth
    
    Auth --> UsersAPI & MatchingAPI & PaymentsAPI & AdminAPI
    
    MatchingAPI --> Gemini
    PaymentsAPI --> Culqi & BCP
    AdminAPI --> Drizzle
    UsersAPI --> Drizzle
    Drizzle --> NeonDB
```

---

## 3. 🗄️ Estructura de la Base de Datos (Tablas Principales)

1. **`users`**: Clientes, Proveedores, Empresas B2B y Administradores (`rol: 'client' | 'provider' | 'business' | 'admin'`).
2. **`orders`**: Solicitudes de servicio, licitaciones B2B, precios, urgencia y estados.
3. **`applications`**: Postulaciones de técnicos a pedidos y consumo de monedas.
4. **`transactions`**: Historial de billetera virtual (recargas de monedas por Culqi/BCP y consumo).
5. **`reports`**: Denuncias de usuarios, problemas en servicios y motivo de suspensión.
6. **`admin_audit_logs`**: Registro de auditoría de cada acción ejecutada en el panel administrativo.
7. **`system_settings`**: Parámetros globales de comisiones, tarifas y llaves configurables.
8. **`referrals`**: Control de códigos de referidos y recompensa de monedas de regalo por invitar usuarios.

---

## 4. 👥 Asignación de Roles y División de Trabajo

* **Luchito (CEO & Fundador — Marketing, Crecimiento & Comunidad)**:
  * Dirección ejecutiva y comercial del proyecto.
  * Estrategia de Marketing Digital, creación de contenido y publicaciones en redes sociales (`@todoo__ya`).
  * Atracción e incorporación de clientes, hogares y técnicos independientes a la plataforma.
  * Alianzas comerciales con PyMEs e incentivación del programa de 3 meses gratis.

* **Wilber (Lead Backend & Seguridad)**:
  * Autenticación con tokens JWT y middlewares de control de acceso RBAC.
  * Desarrollo de endpoints Serverless en Node.js/Expo (`/api/admin/*`, `/api/users`, `/api/matching`).
  * Modelado y migración de base de datos Neon.db Postgres mediante Drizzle ORM.

* **Aldair (Finanzas, Pagos & RUC20)**:
  * Integración de la pasarela de pagos Culqi API v2 (gestión de Secret Key en backend).
  * Conexión del sistema de pagos QR BCP Crece y facturación/cumplimiento tributario RUC20.
  * Control del módulo de billetera virtual de monedas y planes de suscripción B2B/B2C.

* **Victor (Desarrollo Frontend Panel Admin & Moderación)**:
  * Construcción de la interfaz web del Panel de Administración (Next.js/React + Tailwind CSS).
  * Desarrollo de la tabla interactiva de gestión de usuarios, buscador global y modal de revisión KYC.
  * Módulo de atención a denuncias (`reports`), arbitraje de disputas y monitoreo de telemetría IA Gemini.

---

## 5. 🚀 Mejores Estratégicas de Costo $0 (Lean Startup & Crecimiento Viral)

Para potenciar la plataforma **sin gastar dinero en servidores ni licencias costosas**, se implementarán las siguientes 7 mejoras de costo cero:

1. **📲 Notificaciones Push Gratuitas (Expo Notifications + FCM)**:
   * *Costo*: **$0/mes**.
   * *Impacto*: Alertar al instante a los técnicos en su celular cuando entra una solicitud en su zona sin necesidad de pagar por SMS.
2. **🎁 Sistema Viral de Referidos ("Invita y Gana Monedas")**:
   * *Costo*: **$0/mes**.
   * *Impacto*: Cada técnico o cliente tiene un código de invitación único. Si un técnico invita a otro, ambos reciben **5 monedas de regalo**. Impulsa el marketing de boca a boca que liderará Luchito.
3. **🌐 Web App Instalable (PWA) de Acceso Directo**:
   * *Costo*: **$0/mes**.
   * *Impacto*: Los usuarios y técnicos pueden instalar la app directamente desde el navegador Chrome/Safari en sus teléfonos con un toque, evitando pagar licencias de tiendas mientras validamos el mercado.
4. **💬 Soporte Directo por WhatsApp Web (Click-to-Chat)**:
   * *Costo*: **$0/mes**.
   * *Impacto*: Botón flotante de ayuda que abre un chat directo de WhatsApp con soporte, ofreciendo atención humana rápida sin contratar chatbots pagados.
5. **🎴 Generador de Insignias y Tarjetas de Presentación Digitales**:
   * *Costo*: **$0/mes**.
   * *Impacto*: Permite a los técnicos descargar una tarjeta con su código QR y sello de "Técnico Verificado en Todo Ya" para compartir en sus estados de WhatsApp y Facebook, generando publicidad gratuita masiva para la marca.
6. **🔗 Landing Page Express con QR para Registro de PyMEs B2B**:
   * *Costo*: **$0/mes**.
   * *Impacto*: Un enlace directo y código QR que activa automáticamente la **Prueba Gratuita de 3 Meses** al registrarse una empresa.
7. **⚡ Infraestructura de Nube Gratuita (Free Tier Maximum Leverage)**:
   * *Neon Postgres Free Tier*: Hasta 0.5 GB de almacenamiento relacional gratis.
   * *Vercel Hobby Plan*: Hosting de backend APIRoutes y Panel Admin $0/mes.
   * *Google Gemini API Free Tier*: Solicitudes gratuitas por minuto para transcripción de audio y emparejamiento.
