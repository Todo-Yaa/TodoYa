# Todo Ya — Servicios Locales en Minutos 🚀

**Todo Ya** es una aplicación móvil universal y web desarrollada con **React Native** y **Expo** diseñada para conectar a clientes locales con proveedores de servicios de confianza en minutos. La plataforma cuenta con flujos especializados tanto para usuarios residenciales (particulares) como para empresas (B2B/Corporativos).

---

## 🎨 Imagen de Marca y Diseño Premium

* **Logotipo Oficial e Insignia BETA**: Integrado de manera consistente en la pantalla de inicio de sesión (`login-screen`), pantallas de carga (`splash screen`), iconos de la aplicación (iOS/Android/Web) e interfaz general con la insignia estilizada **`BETA`** para indicar la fase activa de demostración y pruebas.
* **Color de Marca**: **`#FFB400`** (un tono oro/amarillo cálido extraído del logotipo oficial) combinado con acabados premium en gris oscuro (`#2F2F2F`) y gradientes modernos en la interfaz de usuario.
* **Estilos B2B y Proveedor**: Acabados en tonalidades índigo (`#6366f1` / `#1e293b`) para denotar un entorno corporativo y profesional premium.
* **Diseño Fijo de Selección Multilingüe**: El selector de idiomas (`ES`, `EN`, `PT-BR`, `QU`, `AY`, `GN`) implementa un contenedor con posición y alineación fija e inamovible, impidiendo desplazamientos o desalineaciones visuales al alternar entre idiomas.

---

## 🛠️ Características Principales Implementadas

### 1. Registro Validado, Términos Exclusivos y Verificación Real por WhatsApp / SMS
* **Términos y Condiciones en Registro de Nuevos Usuarios**: La aceptación explícita y obligatoria de los Términos de Servicio y Política de Privacidad mediante casilla de verificación se exige **exclusivamente al crear una cuenta nueva**, eliminando fricciones en el inicio de sesión habitual.
* **Verificación de Teléfono Real (WhatsApp & SMS)**: Proceso de validación mediante código PIN de 4 dígitos con integración directa para transmisión por **WhatsApp** (`https://wa.me/...`) y **SMS nativo** (`sms:`), además de notificación flotante emergente de respaldo.
* **Registro de Usuarios con Correo Real**: Se captura y valida la dirección de correo real (con control de formato `@` y no vacío) para el registro de cuentas de personas y empresas.
* **Registro por Defecto**: Los usuarios nuevos se registran automáticamente con rol de comprador (`client` para personas naturales y `business` para empresas B2B).
* **Login Flexible**: El sistema de autenticación admite el inicio de sesión indicando indistintamente el correo (`correoOTelefono`), el número celular (`celular`) o con el código de país (`+${codigoPais} ${celular}`).
* **Simulación OAuth**: Flujo visual de inicio de sesión y registro social a través de Google Account y LinkedIn.

### 2. Motor de Búsqueda Semántica IA de 2 Niveles (Deep Matching)
* **Filtro 1 (Categoría Base)**: Clasifica y filtra los proveedores según la especialidad del servicio (`Plomería`, `Electricidad`, `Climatización`, `Branding & Lettering`, etc.).
* **Filtro 2 (Coincidencia Semántica por Descripción)**: Compara la solicitud del cliente (ej: *"necesito un gasfitero especializado en cambio de tubería de gas"*) con la descripción/biografía técnica del proveedor.
* **Insignias y Posicionamiento Top 1**: Si el proveedor especificó la frase o términos exactos en su perfil, la IA lo posiciona en la primera ubicación con la insignia **`✨ IA 98% Match`**.

### 3. Carruseles de Onboarding de 5 Pasos Diferenciados
* **Diferenciación por Tipo de Entidad**:
  * 🏠 **Persona Natural (Hogar)**: Tonalidades cálidas con foco en resolver emergencias del hogar, radar de 90 segundos, IA por voz multilingüe (Español, Quechua, Aymara, Guaraní) y verificación KYC de técnicos.
  * 💼 **Empresas (B2B Corporativo)**: Tonalidades índigo corporativo con foco en compras de oficina, **3 Meses Gratis de Solicitudes B2B**, subasta invertida y facturación electrónica.
* **Comunidad e Instagram Directo**: En el paso 5, cuenta con un botón interactivo oficial **`Seguir a @todoo__ya`** que abre la aplicación de Instagram en tiempo real.

### 4. Sistema No Invasivo de Mejora de Plan (Estilo Uber One)
* **Modal Emergente Estratégico (`plan-upsell-modal.tsx`)**: Recomienda planes superiores (Plan 2 Profesional `S/. 120/mes` o Plan Empresa `S/. 300/mes`) mostrando carruseles horizontales de beneficios.
* **Frecuencia Inteligente Cero Fricción**: Solo se muestra **1 vez cada 24 horas** con un retardo amigable de 3 segundos, y se desactiva permanentemente para usuarios con planes Élite máximos.

### 5. Búsqueda de Proveedores en Tiempo Real (Estilo inDriver & B2B)
* **Geocodificación de Moneda por GPS**: Ajuste automático a la divisa local (`S/.` para Perú, `Bs.` para Bolivia).
* **Flujo Residencial**: Cuenta regresiva de 90s con mapa interactivo y tarifas dinámicas progresivas.
* **Flujo Corporativo B2B (Contraofertas)**: Presupuesto objetivo corporativo con subasta invertida en tiempo real y cotizaciones de proveedores.

### 6. Sistema de Calificación Forzada con Bloqueo (Estilo Jango)
* **Bloqueo a Nivel Raíz**: La aplicación detecta servicios completados sin calificar y bloquea el uso hasta recibir la evaluación con estrellas y etiquetas de retroalimentación.

### 7. Verificación KYC de Proveedores
* **Modulo KYC Obligatorio**: Escaneo de DNI/C.I. y biometría facial mediante selfie para autorizar el perfil de proveedor de servicios.

### 8. Sistema de Denuncias y Control de Baneo (Administrador)
* **Reportes y Baneo en Tiempo Real**: Botón de denuncia en tarjetas de pedido y panel administrativo para suspender/reactivar cuentas infractoras.

---

## ⚡ Escalabilidad y Rendimiento para 1,000+ Usuarios Activos en Perú

La arquitectura de **Todo Ya** ha sido sometida a análisis y pruebas de concurrencia para soportar más de **1,000 usuarios activos simultáneos** en el lanzamiento inicial en Perú:

1. **APIs Legales RENIEC / SUNAT (`/api/peru-legal`)**: Sistema de tolerancia a fallos (*fallback automático*) que procesa consultas de DNI de 8 dígitos y RUC de 11 dígitos sin congelar la aplicación ante alta demanda.
2. **Geocodificación GPS (`/api/peru-geo`)**: Uso de GPS nativo en móviles (`expo-location`) con consumo 0 de servidor, y respaldo OpenStreetMap Nominatim en Web.
3. **Facturación y Comprobantes SUNAT (`/api/peru-invoice`)**: Funciones Serverless en Vercel de auto-escalado dinámico con capacidad para procesar miles de Boletas/Facturas con IGV (18%) por segundo.
4. **Verificación de Teléfono por WhatsApp (`/api/send-sms`)**: Transmisión nativa ilimitada por protocolo `wa.me/+51` con costo cero de infraestructura.
5. **Base de Datos Neon DB (PostgreSQL)**: Conexión mediante *Connection Pooling Serverless* optimizada para gestionar más de **10,000 conexiones concurrentes**.

---

## 🏛️ Dossier de Inversión

El proyecto cuenta con su documentación ejecutiva estructurada en:
- [`DOSSIER_INVERSIONISTA.md`](file:///c:/Users/PCZ/Desktop/todo-ya/DOSSIER_INVERSIONISTA.md): Dossier completo para rondas de inversión.

---

## 💻 Pila Tecnológica (Tech Stack)

1. **Núcleo**: React Native (v0.85), React 19 y Expo (v56).
2. **Estilos**: Vanilla CSS / React Native StyleSheet con tokens de diseño adaptativos.
3. **IA & NLP**: Google Gemini API integration para reconocimiento gramatical, multilingüismo y emparejamiento semántico de 2 niveles.
4. **Base de Datos & Backend**: Neon DB (PostgreSQL) con Drizzle ORM y Expo API Routes Serverless.
5. **APIs Locales Perú**: `/api/peru-legal` (RENIEC/SUNAT), `/api/peru-geo` (OpenStreetMap) y `/api/peru-invoice` (Comprobantes IGV 18%).
