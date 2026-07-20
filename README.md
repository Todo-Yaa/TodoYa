# Todo Ya — Servicios Locales en Minutos 🚀

**Todo Ya** es una aplicación móvil universal y web desarrollada con **React Native** y **Expo** diseñada para conectar a clientes locales con proveedores de servicios de confianza en minutos. La plataforma cuenta con flujos especializados tanto para usuarios residenciales (particulares) como para empresas (B2B/Corporativos).

---

## 🎨 Imagen de Marca y Diseño Premium

* **Logotipo Oficial**: Integrado de manera consistente en la pantalla de inicio de sesión (`login-screen`), pantallas de carga (`splash screen`), iconos de la aplicación (iOS/Android/Web) e iconos adaptables de sistemas operativos.
* **Color de Marca**: **`#FFB400`** (un tono oro/amarillo cálido extraído del logotipo oficial) combinado con acabados premium en gris oscuro (`#2F2F2F`) y gradientes modernos en la interfaz de usuario.
* **Estilos B2B y Proveedor**: Acabados en tonalidades índigo (`#6366f1` / `#1e293b`) para denotar un entorno corporativo y profesional premium.

---

## 🛠️ Características Principales Implementadas

### 1. Registro Validado e Inicio de Sesión Multimodal (Flexibilidad y Seguridad)
* **Registro de Usuarios con Correo Real**: Se captura y valida la dirección de correo real (con control de formato `@` y no vacío) para el registro de cuentas de personas y empresas.
* **Registro por Defecto**: Los usuarios nuevos se registran automáticamente con rol de comprador (`client` para personas naturales y `business` para empresas B2B).
* **Login Flexible**: El sistema de autenticación admite el inicio de sesión indicando indistintamente el correo (`correoOTelefono`), el número celular (`celular`) o con el código de país (`+${codigoPais} ${celular}`).
* **Simulación OAuth**: Flujo visual de inicio de sesión y registro social a través de Google Account y LinkedIn.

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
* **Unificación Cromática B2B**: Las pantallas de proveedor (*Leads*, *Estadísticas*, *Trabajos* y *Mi Perfil*) y el enrutador principal adaptan sus colores de fondo y acentos al morado/índigo corporativo si el usuario activo es una entidad de tipo empresa (`tipoEntidad === 'empresa'`), garantizando una experiencia de marca uniforme y fluida.


### 4. Búsqueda de Proveedores en Tiempo Real (Estilo inDriver)
* **Geocodificación de Moneda por GPS**: El sistema obtiene por GPS las coordenadas del cliente y usa `Location.reverseGeocodeAsync` para detectar el país. Si es detectado, aplica automáticamente el símbolo monetario de esa región (Bs. para Bolivia, S/. para Perú, COP$ para Colombia, etc.) o cae en fallback del prefijo telefónico.
* **Flujo Residencial**:
  * Cuenta regresiva visual de **90 segundos**.
  * Cobertura y costo sugerido de consulta dinámicos y progresivos:
    * **0 - 30 segundos**: Radio de cobertura de `1.0 km` y costo de `10`.
    * **31 - 60 segundos**: Radio de cobertura de `1.5 km` y costo de `15`.
    * **61 - 90 segundos**: Radio de cobertura de `2.0 km` y costo de `20`.
  * Mapa Leaflet dinámico con marcadores de proveedores cercanos con emojis personalizados según su oficio.
  * Si el tiempo expira sin seleccionar un proveedor, se ofrece la opción de reintentar o publicar en la lista general.
* **Flujo Corporativo B2B (Contraofertas)**:
  * Cuenta regresiva visual de **30 segundos** en el que se expande la cobertura progresivamente de 1.5 km a 5.0 km.
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

### 8. Registro Regional con Celular y Doble Factor (PIN SMS)
* **Soporte para Latinoamérica**: El formulario de registro integra selectores de códigos de país con banderas para países latinos (Bolivia 🇧🇴, Perú 🇵🇪, etc.) y campos numéricos para celular.
* **Seguridad de Acceso (SMS PIN)**: El proceso de registro cuenta con una verificación de doble factor, enviando un PIN de 4 dígitos (simulado vía toast superior en tiempo real) que el usuario debe validar en un modal interactivo con cuenta regresiva.

### 9. Verificación KYC de Proveedores
* **Modulo KYC Obligatorio**: Si un usuario residencial desea pasar de cliente a proveedor en su perfil, se le exige realizar un proceso KYC interactivo.
* **Carga de Identidad y Selfie**: Requiere subir fotos del documento (DNI o Carnet de Extranjería) y una selfie facial, las cuales son validadas mediante un proceso de análisis simulado antes de autorizar el cambio de rol.

### 10. Sistema de Denuncias y Control de Baneo (Administrador)
* **Reportar Proveedor**: Los clientes y empresas disponen de un botón con el icono de bandera (`flag-outline`) en las tarjetas de sus pedidos (activos o completados) para denunciar problemas con proveedores.
* **Modal de Quejas**: Permite seleccionar el motivo (cobro excesivo, no llegó, mal comportamiento, etc.) y describir la situación.
* **Panel de Control Administrativo**: En `/perfil` se dispone de un botón **"Administrar Denuncias"** exclusivo para soporte. Permite ver todos los reportes en tiempo real y presionar **"Banear y Suspender"** para desactivar la cuenta del infractor de forma inmediata, o **"Reactivar Cuenta"** para levantar la sanción.
* **Restricción de Acceso**: Las cuentas marcadas como baneadas son bloqueadas en el login e informadas con un banner de advertencia.

### 11. Permisos GPS en Tiempo Real y Cambio de Ciudad
* **Solicitud de Permisos Reales**: Gestión nativa de permisos de localización mediante el módulo de `expo-location` para acceder al GPS del dispositivo en tiempo real.
* **Geocodificación Inversa Real**: Resuelve de forma automática las coordenadas del GPS mediante `Location.reverseGeocodeAsync` para detectar el nombre de la ciudad del usuario (Arequipa, Lima, Santa Cruz de la Sierra, etc.), con un algoritmo de fallback geográfico en base a coordenadas para entornos Web.
* **Alerta Flotante Global**: Despliega un modal flotante e interactivo si el sistema capta que el usuario estaba previamente en una ciudad y ahora se encuentra en otra distinta. Dicho chequeo ocurre al iniciar la app, ingresar a las pantallas de solicitud de servicio (`solicitar.tsx`), acceder al panel de Leads (`leads.tsx`) o al cambiar de rol en la aplicación.
* **Actualización en Caliente**: Permite confirmar la nueva ciudad en caliente (guardándola en `Storage`) o mantener la anterior de forma de sesión. Además, el usuario puede presionar sobre su ciudad en la cabecera del dashboard o perfil para forzar una lectura del GPS en cualquier instante de forma proactiva.

### 12. Monedas y Cobro de Comisiones a Proveedores
* **Gestión de Saldo (Monedas)**: Los usuarios proveedores poseen un atributo `monedas` que representa su saldo para operar en la aplicación.
* **Débito de Comisión por Plan**: Al aceptar una solicitud residencial, se le debita una comisión sobre el valor de la consulta calculada automáticamente según su plan de suscripción activa:
  * **Plan 1 (Básico):** Cobra el 20% del valor de la consulta en monedas.
  * **Plan 2 (Premium):** Cobra el 10% del valor de la consulta en monedas.
  * **Plan 3 (Ilimitado):** Cobra el 0% (comisión exenta).
* **Transacciones de Wallet**: En caso de que la conexión de base de datos remota esté activa (`isDbOnline`), se registra la transacción por POST en `/api/wallet` para fines contables e historial del proveedor.

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
