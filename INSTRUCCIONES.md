# Todo Ya — Desactivación controlada de API Expo antigua

## Alcance
11 rutas antiguas que importaban `db`/`isDbConnected` se mueven fuera de `src/app/api` y se renombran `.ts.disabled.txt` para que Expo Router y TypeScript no las compilen. Los códigos se conservan sin modificación.
**No se borran archivos ni se modifica NestJS/PostgreSQL ni la UI.**

## Aplicación
1. Extrae este ZIP en la raíz `~/TODOYA-DEV/Todo_ya-`.
2. Ejecuta `bash aplicar_desactivacion.sh` dentro de ese directorio.
3. Detén Expo y reinicia con `npx expo start --web --clear`.
4. Ejecuta `npx tsc --noEmit` para verificar.

## Limitación importante
Estas rutas siguen siendo invocadas por pantallas/servicios heredados. Tras desactivación, sus llamadas responderán 404 en vez de ejecutar código viejo; los módulos de pedidos, chat, denuncias, pagos, billetera, matching, sincronización y otros requerirán migración a NestJS. Un TypeScript limpio NO implica que esos flujos funcionen.
El archivo `src/app/api/users+api.ts` ya es un endpoint deshabilitado (410), no se modifica.
Otros endpoints (`kyc`, `auth-linkedin`, `transcribe`) siguen operativos/no cambiados y deben revisarse por separado antes de su lanzamiento.

## Rutas desactivadas y consumidores detectados

| Ruta desactivada | Referencias desde app |
|---|---|
| `src/app/api/reports+api.ts` | `src/app/perfil.tsx`, `src/context/user-context.tsx` |
| `src/app/api/applications+api.ts` | `src/context/user-context.tsx` |
| `src/app/api/chat+api.ts` | `src/app/chat-room.tsx`, `src/context/user-context.tsx` |
| `src/app/api/db-status+api.ts` | `src/context/user-context.tsx` |
| `src/app/api/matching+api.ts` | `src/services/ai-matching.ts` |
| `src/app/api/orders+api.ts` | `src/context/user-context.tsx` |
| `src/app/api/ratings+api.ts` | Sin referencias directas |
| `src/app/api/seed+api.ts` | `src/context/user-context.tsx` |
| `src/app/api/sync+api.ts` | `src/context/user-context.tsx` |
| `src/app/api/veripagos+api.ts` | `src/app/leads.tsx` |
| `src/app/api/wallet+api.ts` | `src/app/leads.tsx`, `src/context/user-context.tsx` |

## Restauración
Los originales quedan en `legacy-disabled/expo-api/` con extensión `.ts.disabled.txt`. Para reactivarlos: mueve manualmente el archivo al path original, quitando el sufijo `.disabled.txt`, únicamente después de evaluar seguridad y dependencias.
