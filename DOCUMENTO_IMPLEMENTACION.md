# Documentación Detallada de Implementación — Proyecto "Todo Ya" 📋

Este documento contiene todo el contexto técnico de los cambios, la arquitectura y las nuevas características implementadas en el proyecto para asegurar el primer lugar en la Hackathon de la UTEPSA.

---

## 🏗️ Resumen General del Trabajo Realizado

Hemos transformado una aplicación con datos estáticos locales en una plataforma con arquitectura híbrida lista para producción. El sistema cuenta ahora con:
1.  **Backend Integrado (Serverless)**: Expo Router API Routes listos para conectarse con Neon.db (PostgreSQL Serverless) usando Drizzle ORM.
2.  **Motor de Matching por IA / NLP**: Un algoritmo que analiza las solicitudes de los clientes en lenguaje natural, calcula distancias y asigna un puntaje de idoneidad (score) a los proveedores.
3.  **Localización Inclusiva (i18n)**: Traducción completa a 5 idiomas, incluyendo las lenguas originarias de Bolivia (Español, Inglés, Quechua, Aymara y Guaraní).
4.  **Optimización del Bundler**: Solución a incompatibilidades del empaquetado de módulos en Metro mediante una configuración personalizada de resolución.

---

## 📁 Estructura de los Nuevos Archivos

A continuación se detalla la ubicación y propósito de cada archivo creado o modificado en esta tanda de desarrollo:

```text
Todo_ya-/
├── metro.config.js                  # [NUEVO] Solución de empaquetado ESM para Metro/Expo
├── app.json                         # [MODIFICADO] Habilitación de Expo API Routes (output: server)
├── DOCUMENTO_IMPLEMENTACION.md      # [NUEVO] Este documento de guía
└── src/
    ├── db/                          # [NUEVA CARPETA] Capa de Base de Datos
    │   ├── index.ts                 # Instanciación de Drizzle con Neon.db (HTTP Serverless)
    │   └── schema.ts                # Modelado relacional en TypeScript (users, orders)
    ├── i18n/                        # [NUEVA CARPETA] Capa de Internacionalización
    │   ├── index.ts                 # Configuración de i18next y expo-localization
    │   └── locales/                 # Diccionarios JSON de traducción
    │       ├── es.json              # Español
    │       ├── en.json              # Inglés
    │       ├── qu.json              # Quechua (Inclusión social)
    │       ├── ay.json              # Aymara (Inclusión social)
    │       └── gn.json              # Guaraní (Inclusión regional - Oriente Boliviano)
    ├── services/                    # [NUEVA CARPETA] Capa de Lógica de Negocio
    │   └── ai-matching.ts           # Servicio del Algoritmo de Emparejamiento e IA
    └── app/
        ├── _layout.tsx              # [MODIFICADO] Inicialización asíncrona de i18n al arrancar la app
        ├── perfil.tsx               # [MODIFICADO] UI del Selector de idiomas en los ajustes
        ├── solicitar.tsx            # [MODIFICADO] Conexión del formulario al algoritmo de matching y localización
        └── api/                     # [NUEVA CARPETA] Endpoints Backend
            ├── db-status+api.ts     # GET: Estado de conexión de Neon.db
            └── matching+api.ts      # POST: Endpoint listo para OpenAI/Gemini e IA local
```

---

## 🛠️ Detalles de Implementación por Fase

### 🐘 Fase 1: Neon.db, Drizzle ORM y Expo API Routes
*   **Expo API Routes**: Se activó `"output": "server"` en la sección `"web"` de `app.json`. Esto permite escribir APIs en la misma estructura de carpetas de Expo (`src/app/api/...`) con formato de archivo `+api.ts` (manejadores estándar `GET`, `POST`, etc.).
*   **Modelado Relacional (`schema.ts`)**:
    *   Definimos la tabla `users` que unifica los roles `client`, `provider` y `business` (para flujos corporativos B2B), incluyendo campos para la experiencia, NIT, y servicios ofrecidos.
    *   Definimos la tabla `orders` que maneja el ciclo de vida del pedido (`Buscando proveedor` | `En progreso` | `Completado`), el progreso, precio, nivel de urgencia y los campos de la calificación forzada de estrellas y etiquetas.
*   **Conector de Neon (`index.ts`)**: Se configuró para que intente leer la variable de entorno `EXPO_PUBLIC_DATABASE_URL` (para cuando crees tu base de datos de Neon y la configures en un archivo `.env`). Si no está presente, tiene un fallback seguro para evitar que la aplicación falle.
*   **Ruta `/api/db-status`**: Un endpoint simple para chequear la conexión.
*   **Ruta `/api/matching`**: El corazón del procesamiento. Contiene los comentarios y bloques de código listos para realizar peticiones HTTP a la API de **OpenAI (GPT-4o-mini)** o **Google Gemini (1.5 Flash)** para clasificar solicitudes, y tiene integrado nuestro algoritmo en caso de no contar con credenciales de IA.

---

### 🌍 Fase 2: Internacionalización e Inclusión Cultural (i18n)
*   **Idiomas Nativos Bolivianos**: Añadimos Quechua, Aymara y Guaraní. La inclusión de lenguas originarias tiene un alto valor en hackatones universitarias por su impacto social y accesibilidad.
*   **Detección de Sistema**: La app usa `expo-localization` para leer el lenguaje por defecto del teléfono del usuario. Si es uno de los 5 soportados, se activa automáticamente; si no, se usa Español como fallback.
*   **Selector de Idiomas**: Ubicado en el Perfil de usuario. Consta de una fila con el icono del globo terráqueo (`globe-outline`) y 5 chips interactivos (`ES`, `EN`, `QU`, `AY`, `GN`) que guardan la preferencia del usuario en el dispositivo (`Storage`) para recordar su selección en futuras visitas.

---

### 🧠 Fase 3: Motor del Algoritmo de Emparejamiento (`ai-matching.ts`)
Para emparejar a los clientes con los mejores proveedores en minutos, desarrollamos una lógica que calcula una puntuación de coincidencia (**Score**):
1.  **Análisis NLP (Lenguaje Natural)**: El texto del usuario ("*gotea agua del lavabo*") es analizado para extraer palabras clave. Si contiene términos como *fuga, caño, gotera*, detecta la especialidad **Plomería**. Si el texto incluye palabras de apremio (*urgente, rápido, inmediato, ahora*), eleva la urgencia a **Alta**.
2.  **Fórmula de Haversine (Distancia)**: Calcula la distancia en línea recta sobre la curvatura terrestre entre las coordenadas de latitud/longitud del cliente y el proveedor:
    $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$
3.  **Puntuación de Coincidencia (Score)**: Cada proveedor filtrado por la especialidad recibe una nota del 0.0 al 1.0 basada en tres factores normalizados:
    *   **Calificación (40% de peso)**: Basado en el rating de 5 estrellas del proveedor.
    *   **Cercanía (40% de peso)**: Basado en la distancia (máximo a 10 km, mientras más cerca, mayor puntuación).
    *   **Experiencia (20% de peso)**: Basado en los años de experiencia profesional (tope en 10 años).
4.  El servicio `matchProviders` de forma inteligente realiza la petición online al endpoint, y si la red o el servidor fallan, ejecuta la misma lógica localmente en el cliente sin interrumpir la experiencia de usuario.

---

### 📺 Fase 4: Integración Visual
*   Conectamos la pantalla de Solicitud ([solicitar.tsx](file:///c:/Users/usuario/Desktop/descargas/Hackatones%20UTEPSA/Todo_ya-/src/app/solicitar.tsx)) para que use el motor `matchProviders`. Al escribir tu requerimiento y presionar "Analizar", se dispara el flujo del algoritmo y se mapean los mejores proveedores en el mapa interactivo y en la lista de ofertas.
*   Se tradujeron dinámicamente todos los elementos estáticos de esta pantalla (títulos, subtítulos de urgencias, indicadores del radar de escaneo e inputs) a los 5 idiomas.

---

## ⚡ Solución al Problema de Bundling de Metro
Al iniciar la aplicación, Metro fallaba con el error:
`Unable to resolve "./IcuTransUtils/index.js" from "node_modules\react-i18next\dist\es\IcuTransWithoutContext.js"`

**Causa**: La versión más reciente de `react-i18next` (v17.0.8) viene empaquetada con módulos ES (ESM) que contienen extensiones de importación explícitas (`index.js`). El bundler Metro de React Native/Expo tiene limitaciones para resolver estas rutas internas en archivos distribuidos en carpetas profundas de `node_modules`.

**Solución**: Creamos un archivo de configuración personalizado de Metro ([metro.config.js](file:///c:/Users/usuario/Desktop/descargas/Hackatones%20UTEPSA/Todo_ya-/metro.config.js)) en la raíz que redirige automáticamente todas las importaciones de `'react-i18next'` al build CommonJS (CJS) del paquete:
```javascript
config.resolver.extraNodeModules = {
  'react-i18next': path.resolve(__dirname, 'node_modules/react-i18next/dist/commonjs/index.js'),
};
```
Esto resuelve la compilación al 100%, permitiendo arrancar el servidor web y móvil sin ningún fallo.

---

## 🚦 Cómo Arrancar y Probar el Proyecto

Para iniciar el servidor de desarrollo, ejecuta en tu terminal de Windows (PowerShell):

```powershell
npm run dev
```

Una vez que el bundle Metro compile correctamente (gracias a la nueva regla de Metro), presiona **`w`** para abrir la versión Web en el navegador. 

### Pasos para probar la demo:
1.  Ve a la pestaña de **Perfil**, cambia el idioma a **Quechua (`QU`)** o **Guaraní (`GN`)** y observa cómo cambian los títulos.
2.  Regresa a **Español** o quédate en tu idioma preferido y ve a la pestaña de **Solicitar** (`+`).
3.  Escribe: *"tengo un cortocircuito y chispea el enchufe, es urgente"* y presiona **Analizar**.
4.  Observa el resultado: el algoritmo detectará la categoría **Electricidad**, marcará la urgencia como **Alta**, sugerirá un rango de precio justo y buscará a los electricistas mockeados ordenándolos dinámicamente según la puntuación de distancia y rating en tu radar de escaneo.
