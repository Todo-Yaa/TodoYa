# Todo Ya — Servicios Locales en Minutos 🚀

**Todo Ya** es una aplicación móvil universal y web desarrollada con **React Native** y **Expo** diseñada para conectar a clientes locales con proveedores de servicios de confianza en minutos. La plataforma cuenta con flujos especializados tanto para usuarios residenciales (particulares) como para empresas (B2B/Corporativos).

---

## 🎨 Imagen de Marca y Diseño Premium

* **Logotipo Oficial**: Integrado de manera consistente en la pantalla de inicio de sesión (`login-screen`), pantallas de carga (`splash screen`), iconos de la aplicación (iOS/Android/Web) e iconos adaptables de sistemas operativos.
* **Color de Marca**: **`#FFB400`** (un tono oro/amarillo cálido extraído del logotipo oficial) combinado con acabados premium en gris oscuro (`#2F2F2F`) y gradientes modernos en la interfaz de usuario.
* **Estilos B2B y Proveedor**: Acabados en tonalidades índigo (`#6366f1` / `#1e293b`) para denotar un entorno corporativo y profesional premium.

---

## 🛠️ Características Principales Implementadas

### 1. Registro Simplificado e Inicio de Sesión Social (OAuth)
* **Registro por Defecto**: Los usuarios nuevos se registran automáticamente con rol de comprador (`client` para personas naturales y `business` para empresas B2B).
* **Simulación OAuth**: Flujo visual de inicio de sesión y registro social a través de Google Account y LinkedIn que sincroniza datos de perfil en un entorno simulado de navegador.

### 2. Onboarding Modal e Interceptación de Proveedores
* Al intentar cambiar al rol de **Proveedor** (`provider`) por primera vez, la aplicación intercepta la acción y abre un formulario interactivo según el tipo de entidad:
  * **Persona Natural**: Preguntas de especialidad (Plomería, Electricidad, Pintura, Climatización), años de experiencia y descripción profesional.
  * **Empresa (B2B)**: Preguntas de rubro comercial (Papelería, Decoración, Branding, Servicios), cobertura (Local/Nacional) y presentación comercial.
* Las respuestas se guardan en la cuenta para renderizar dinámicamente su perfil profesional (`pperfil.tsx`) con etiquetas temáticas.

### 3. Separación Estricta de Roles (Natural vs. Empresa)
* **Filtrado Dinámico de Roles**: El selector de roles del perfil del cliente filtra las opciones según su registro:
  * Las **Empresas** solo pueden alternar entre *Empresa (Cliente)* y *Proveedor*.
  * Las **Personas Naturales** solo pueden alternar entre *Cliente residencial* y *Proveedor*.
* **Cohesión de Retorno**: El botón de regreso en el perfil profesional se adapta contextualmente para mostrar *"Volver a modo Empresa"* o *"Volver a modo Cliente residencial"* según el usuario activo.

### 4. Búsqueda de Proveedores en Tiempo Real (Estilo inDriver)
* **Radar de Escaneo**: Al confirmar un servicio, la aplicación transmite la solicitud en un radio de 5km mediante un radar animado.
* **Flujo Residencial**:
  * Cuenta regresiva visual de **15 segundos**.
  * Mapa Leaflet dinámico con marcadores de proveedores cercanos con emojis personalizados según su oficio.
  * Si el tiempo expira sin seleccionar un proveedor, se ofrece la opción de reintentar o publicar en la lista general.
* **Flujo Corporativo B2B (Contraofertas)**:
  * Se define un **presupuesto objetivo** corporativo en la solicitud.
  * Las empresas proveedoras se postulan de forma progresiva enviando cotizaciones personalizadas: aceptando el presupuesto objetivo o enviando contraofertas (a la baja o al alza por servicios premium).

### 5. Chat de Negociación Corporativa B2B
* Al aceptar la oferta de una empresa en el flujo B2B, se abre una interfaz de **chat interactivo en vivo** con el proveedor seleccionado.
* El chat incluye respuestas automáticas y adaptativas de la empresa proveedora para coordinar detalles comerciales (ej: NIT para factura de ley, correo de facturación electrónica y horarios del proyecto).

### 6. Sistema de Calificación Forzada con Bloqueo (Estilo Jango)
* **Bloqueo a Nivel Raíz**: La aplicación detecta si el usuario tiene algún servicio marcado como 'Completado' que no haya calificado. De existir, bloquea el uso de la aplicación mediante un modal superpuesto a pantalla completa.
* **Calificación Dinámica**:
  * Fila interactiva de 5 estrellas.
  * Etiquetas de retroalimentación dinámicas adaptadas a la puntuación:
    * *1-2 estrellas*: Etiquetas críticas (`"Mal trabajo"`, `"Mala actitud"`, `"Impuntual"`).
    * *3-4 estrellas*: Etiquetas promedio (`"Trabajo regular"`, `"Poco comunicativo"`).
    * *5 estrellas*: Etiquetas de excelencia (`"Excelente trabajo"`, `"Súper recomendado"`, `"Puntual y rápido"`).

### 7. Corrección del Acceso Rápido y Persistencia de Roles (Bugfix)
* **Consistencia de forceRole**: Corregido un problema en la función `login` de [user-context.tsx](file:///c:/Users/PCZ/Desktop/todo-ya/src/context/user-context.tsx) donde al iniciar sesión mediante los botones de acceso rápido de prueba (que fuerzan un rol específico, como `'business'`), se terminaba cargando el rol anterior persistido en la base de datos local (`usuarioEncontrado.rol` que podía ser `'provider'`). Ahora se respeta estrictamente el `forceRole` provisto por el botón, previniendo redirecciones incorrectas y bloqueos de navegación.

---

## 💻 Pila Tecnológica (Tech Stack)

1. **Núcleo**: React Native (v0.85), React 19 y Expo (v56).
2. **Enrutamiento**: Expo Router (v56) basado en archivos.
3. **Mapas**: Leaflet.js inyectado dinámicamente mediante iFrame Web / WebView nativo.
4. **Animaciones**: React Native Reanimated (v4) para transiciones y el radar de escaneo.
5. **Persistencia**: AsyncStorage simulado de forma consistente mediante módulo `Storage`.
6. **Lenguaje**: TypeScript 100% tipado con validaciones estrictas.

---

## 🚀 Cómo Iniciar el Proyecto

### 1. Instalar Dependencias
Asegúrate de tener instalado Node.js, luego ejecuta:
```bash
npm install
```

### 2. Iniciar el Servidor de Desarrollo
Para correr el proyecto en modo de desarrollo local:
```bash
npm run dev
```
Este comando levantará el servidor Metro en el puerto `7153`. Puedes presionar:
* `w` para abrir la versión Web en tu navegador.
* `a` para abrir en un dispositivo Android o emulador.
* `i` para abrir en un simulador iOS.

### 3. Verificaciones de Tipos
Para correr el type-checker del proyecto:
```bash
npx tsc --noEmit
```
