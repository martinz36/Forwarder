# Forwarder (cliente Marivan)

Software propio del usuario: ERP/CRM para agencia de carga y aduanas en Perú (Marivan Logistics SAC), pensado para venderse como SaaS multiempresa. Repositorio: `martinz36/Forwarder`. Despliegue en Vercel, base Neon Postgres.

## Estado

- Rama `v2`: reconstrucción completa. `main` tiene el sistema anterior (en producción, sin login).
- `legacy/`: código del sistema anterior, solo como referencia para portar PDFs y piezas. Excluido de TypeScript. Borrar cuando ya no se necesite.
- Modelo de datos y decisiones: `docs/modelo-de-datos.md`.

## Tecnología

- Prisma 7 (`prisma.config.ts`, generador `prisma-client` en `src/generated/prisma`, adaptador `@prisma/adapter-pg`). Las tablas nuevas viven en el esquema Postgres `app` (`?schema=app` en la URL); el sistema anterior sigue en `public`.
- Migraciones reales en `prisma/migrations` (nada de `db push`).
- Dinero con `decimal.js` / `Decimal` de Prisma. Nunca `Float` para montos.
- Lógica pura y testeable en `src/lib` (precios) y `src/server/shipments/plan.ts`; pruebas con `node:test` vía `tsx --test`.

## Reglas

- Toda consulta filtra por `organizationId`. Uniques siempre compuestos con `organizationId`.
- Correlativos solo con `src/server/sequences.ts`.
- Una cotización enviada o aceptada no se edita: se crea una versión nueva.
- El cliente solo ve documentos con visibilidad `CLIENT` en estado `FINAL` o `PENDING_CLIENT_APPROVAL`, más los que subió él.
- Textos de la interfaz en español (Perú).
