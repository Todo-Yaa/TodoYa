import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';
import { type PropsWithChildren } from 'react';

/**
 * Componente RootHtml: Personaliza la estructura base del archivo HTML generado por Expo Router
 * en la plataforma Web. Este archivo es ignorado en plataformas nativas (iOS y Android),
 * garantizando que las modificaciones solo afecten a la visualización y comportamiento web.
 */
export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        {/* Asegura la máxima compatibilidad de compatibilidad de Internet Explorer */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* Configura el viewport inicial para un comportamiento responsivo y desactivar zooms no deseados */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Enlace al manifiesto de la aplicación (PWA) para que sea instalable */}
        <link rel="manifest" href="/manifest.json" />
        {/* Define el color de la barra del navegador o barra de tareas móvil en modo standalone */}
        <meta name="theme-color" content="#FFB400" />
        
        {/* Habilita la capacidad de ejecutarse a pantalla completa como una app nativa en Android/Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Habilita la capacidad de ejecutarse a pantalla completa en iOS/Safari (Web Clip) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Establece el estilo de la barra de estado de iOS (por defecto, translúcido o negro) */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Título de la aplicación en la pantalla de inicio al instalar en iOS */}
        <meta name="apple-mobile-web-app-title" content="Todo Ya" />
        {/* Icono de inicio exclusivo para dispositivos iOS */}
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Resetea los estilos específicos de ScrollView de React Native Web para evitar doble scrollbar */}
        <ScrollViewStyleReset />

        {/* Inyecta estilos CSS básicos en el cuerpo HTML para un fondo armónico según el tema claro/oscuro */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>
        {/* Renderiza el árbol completo de pantallas de la aplicación */}
        {children}
        
        {/* Registra el Service Worker en segundo plano solo si el navegador lo soporta */}
        <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} />
      </body>
    </html>
  );
}

// Fondo de pantalla básico de carga inicial para evitar destellos blancos antes del render de la app
const responsiveBackground = `
  body {
    background-color: #f5f5f5;
  }
  @media (prefers-color-scheme: dark) {
    body {
      background-color: #000000;
    }
  }
`;

// Script inline para registrar el service worker local /sw.js al cargarse la ventana
const registerServiceWorker = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        console.log('PWA ServiceWorker registrado con éxito en el ámbito:', registration.scope);
      }).catch(function(err) {
        console.log('Fallo en el registro del PWA ServiceWorker:', err);
      });
    });
  }
`;
