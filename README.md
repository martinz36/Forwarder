# Forwarder

Este proyecto está configurado y conectado a:
- **Repositorio GitHub:** [https://github.com/martinz36/Forwarder.git](https://github.com/martinz36/Forwarder.git)
- **Base de datos:** Neon PostgreSQL (EE.UU. East 2)

## Configuración del Entorno

Las variables de entorno se gestionan a través del archivo `.env`:

```env
DATABASE_URL="postgresql://neondb_owner:***@ep-jolly-queen-a5f5u1f6-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

El archivo `.env` está excluido del control de versiones (`.gitignore`) por razones de seguridad.

## Uso

Para usar la base de datos en Node.js o Python, asegúrate de cargar la variable `DATABASE_URL` desde `.env`.
