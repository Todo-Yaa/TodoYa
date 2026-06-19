# Ficha Técnica — Todo Ya 📋

Este documento detalla las especificaciones técnicas, arquitectura, modelo de datos y componentes del proyecto **Todo Ya**. Se actualizará de manera continua a medida que progresemos con nuevas implementaciones.

---

## 📌 Información General

* **Nombre del Proyecto**: Todo Ya
* **Tipo de Aplicación**: Aplicación móvil universal multiplataforma (Android & iOS) y Web (PWA).
* **Framework Principal**: Expo SDK 56 & React Native 0.85.
* **Idioma de Desarrollo**: Español (código fuente, comentarios e interfaz).
* **Control de Tipos**: TypeScript 6.0.

---

## 🏗️ Arquitectura del Software

### 1. Enrutamiento y Navegación (Routing)
* **Tecnología**: Expo Router v56 (navegación basada en archivos).
* **Estructura**:
  * Pestañas en la base de la aplicación (`Tabs`) gestionadas mediante `src/app/_layout.tsx`.
  * Pantalla de inicio (`index.tsx`), Leads de trabajo (`leads.tsx`), Historial de solicitudes (`pedidos.tsx`), Perfiles (`perfil.tsx` / `pperfil.tsx`) y Formulario de Solicitudes (`solicitar.tsx`).

### 2. Gestión de Estado Global (State Management)
* **Tecnología**: React Context API (`src/context/user-context.tsx`).
* **Persistencia**: AsyncStorage simulado (`src/utils/storage.ts`) para persistir la sesión del usuario, monedas, perfil de proveedor y el historial de pedidos de manera local en el dispositivo.

### 3. Hibridación de Mapas (Web & Nativo)
* **Componente**: `src/components/map-view.tsx`.
* **Motor**: Leaflet.js inyectado mediante un `iframe` HTML dinámico (`srcDoc`) en la web, y simulación de radar en plataformas móviles nativas. Permite renderizar pines con la ubicación en tiempo real del cliente y de los proveedores disponibles de acuerdo a la categoría seleccionada.

---

## 🗄️ Modelos de Datos (Interfaces Clave)

### 1. Usuario Registrado (`UsuarioRegistrado`)
Representa las cuentas del sistema, divididas en clientes naturales, corporativos y proveedores:
```typescript
export interface UsuarioRegistrado {
  nombre: string;
  correoOTelefono: string;
  rol: 'client' | 'provider' | 'business';
  contrasena?: string;
  tipoProveedor: 'google' | 'linkedin' | 'normal';
  tipoEntidad: 'natural' | 'empresa';
  nit?: string;
  correoFacturacion?: string;
  rubro?: string;
  ofreceB2B?: boolean;
  proveedorConfigurado?: boolean;
  serviciosOfrecidos?: string[];
  anosExperiencia?: string;
  descripcionProveedor?: string;
  coberturaB2B?: string;
}
```

### 2. Pedidos / Solicitudes de Servicio (`Order`)
Representa los registros de servicios solicitados e historial:
```typescript
export interface Order {
  id: number;
  titulo: string;
  proveedor: string | null; // Asignado al aceptar oferta, null si busca
  servicio: string;        // Categoría (Plomería, Electricidad, Insumos, etc.)
  description: string;     // Requerimientos detallados
  estado: 'Buscando proveedor' | 'En progreso' | 'Completado';
  progreso: number;        // Porcentaje visual (25%, 65%, 100%)
  hora: string;            // Registro de tiempo
  color: string;           // Color temático del tag de estado
  precio: string;          // Tarifa final o rango sugerido
  urgencia: 'Normal' | 'Alta';
  calificado?: boolean;
  calificacionEstrellas?: number;
  calificacionEtiquetas?: string[];
}
```

---

## ⚙️ Componentes Técnicos Principales

### 1. Formulario de Solicitud e IA NLP (`solicitar.tsx`)
* **Motor NLP Simulado**: Analiza la descripción del servicio escrita por el usuario en tiempo real para determinar:
  * Categoría de servicio.
  * Presupuesto sugerido de mercado.
  * Nivel de urgencia.
* **Presupuesto objetivo B2B**: Para cuentas corporativas, habilita un input numérico para que la empresa defina su presupuesto objetivo en bolivianos (Bs.).

### 2. Motor de Subastas y Contraofertas B2B
* **Subasta en Vivo**: Simula la llegada progresiva de cotizaciones de proveedores (con esperas controladas de ~1.2s).
* **Contraofertas**: Generación dinámica de cotizaciones en base al presupuesto del cliente (iguales, más baratas o más caras con valor premium).

### 3. Chat Interactivo en Tiempo Real
* Canal directo de mensajería con la empresa seleccionada tras aceptar su oferta.
* Simulación inteligente de respuestas del proveedor (coordinación de facturación, NIT, horarios y puesta en marcha del servicio).

### 4. Sistema de Calificación y Bloqueo Condicional (`rating-overlay-modal.tsx`)
* Intercepta el inicio de la navegación si detecta un pedido `Completado` sin calificación.
* **Bloqueo Físico**: Impide usar cualquier otra pantalla de la app hasta calificar.
* **Chips Dinámicos**: Muestra etiquetas críticas (`Impuntual`, `Mal trabajo`) con calificaciones bajas (1-2★) y etiquetas de excelencia (`Muy recomendado`, `Gran actitud`) con 5★.

---

## 📋 Especificación de Versiones de Software
* **`react`**: `19.2.3`
* **`react-native`**: `0.85.3`
* **`expo`**: `~56.0.12`
* **`expo-router`**: `~56.2.11`
* **`react-native-reanimated`**: `4.3.1`
* **`expo-image`**: `~56.0.11`
