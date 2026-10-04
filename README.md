# Forwarder v2

Sistema para agencias de carga y aduanas: cotizaciones con plantillas y tarifarios, embarques con hitos, documentos con control de visibilidad, facturación y portal del cliente. Multiempresa.

> Rama `v2` en construcción. El sistema anterior quedó en `legacy/` solo como referencia y sigue funcionando en `main`.

- Modelo de datos y decisiones: [docs/modelo-de-datos.md](docs/modelo-de-datos.md)
- Esquema: [prisma/schema.prisma](prisma/schema.prisma)

## Puesta en marcha

1. Copiar `.env.example` a `.env` y completar las conexiones de Neon.
2. `npm install`
3. `npx prisma migrate deploy` — crea las tablas nuevas en el esquema `app` (no toca `public`).
4. `npm run legacy:import -- --dry-run` — simula la importación del sistema anterior y muestra el resultado.
5. `npm run legacy:import` — importa clientes, cotizaciones y embarques en curso.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run db:validate` | Valida el esquema |
| `npm run db:migrate` | Aplica migraciones |
| `npm run db:seed` | Crea una empresa de demostración con catálogos por defecto |
| `npm run legacy:import` | Importa desde el sistema anterior (`--dry-run` para simular) |
| `npm test` | Pruebas del motor de precios y del importador |
| `npm run typecheck` | Verificación de tipos |
