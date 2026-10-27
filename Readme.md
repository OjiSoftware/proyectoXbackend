# ElementAll - Backend API

API del sistema ElementAll, desarrollada con Express, TypeScript y Prisma.

## Tecnologias

- Express 5 y TypeScript.
- Prisma ORM.
- PostgreSQL alojado en Neon.
- Vercel para el despliegue del backend.
- JWT en cookies para autenticacion.
- Nodemailer para correo electronico.
- Mercado Pago: implementacion conservada, pero actualmente en standby.

## Arquitectura

Flujo general de una peticion:

```text
Request -> Router -> Middleware -> Controller -> Service -> Repository -> Database
```

- `src/app.ts`: configura Express, middlewares y rutas; exporta la aplicacion sin abrir un puerto.
- `src/local-server.ts`: arranque local con `app.listen`. Tambien es el objetivo de `npm run dev` y `npm start`.
- `src/routes/`: definicion de endpoints.
- `src/controllers/`: reciben las peticiones y devuelven respuestas.
- `src/services/`: logica de negocio.
- `src/repositories/`: acceso a datos mediante Prisma.
- `src/middlewares/`: autenticacion y procesamiento compartido.
- `prisma/schema.prisma`: modelos y relaciones de la base de datos.

## Base de datos

El proyecto utiliza PostgreSQL en Neon. Prisma obtiene la cadena de conexion desde `DATABASE_URL`, configurada en `prisma.config.ts`.

No usar las antiguas variables `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD` o `DATABASE_NAME` para la conexion actual de la aplicacion.

### Comandos de Prisma

```bash
# Validar el esquema sin modificar la base
npx prisma validate

# Generar el cliente Prisma en src/generated/prisma
npm run prisma:generate

# Sincronizar el esquema con la base indicada por DATABASE_URL
npx prisma db push
```

`prisma generate` genera codigo localmente; no modifica la base. `prisma db push` se conecta a la base indicada por `DATABASE_URL` y puede modificar su esquema. Antes de ejecutarlo, verificar que la URL apunta a la base correcta.

El cliente generado esta ignorado por Git. Por eso `npm run build` lo genera antes de compilar TypeScript.

## Desarrollo local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear `.env` local con, como minimo:

   ```env
   PORT=3000
   DATABASE_URL="URL_DE_CONEXION_DE_NEON"
   JWT_SECRET="SECRETO_LARGO_Y_ALEATORIO"
   FRONTEND_URL="http://localhost:5173"
   ```

   No guardar ni subir credenciales reales al repositorio.

3. Generar el cliente y compilar:

   ```bash
   npm run build
   ```

4. Iniciar el servidor local:

   ```bash
   npm run dev
   ```

   `npm start` inicia la version compilada y requiere ejecutar previamente `npm run build`.

La ruta `GET /` responde `API funcionando`. `GET /api/categories` permite comprobar una lectura de la base; una respuesta `[]` significa que la consulta fue exitosa y no hay categorias cargadas.

## Despliegue en Vercel

El backend esta desplegado como aplicacion Express en Vercel. El build configurado es:

```bash
npm run build
```

Configurar las variables en el proyecto de Vercel, sin comillas:

- `DATABASE_URL`: cadena de conexion de Neon. Usar la conexion pooled para la ejecucion de la aplicacion.
- `JWT_SECRET`: secreto nuevo, largo y aleatorio.
- `FRONTEND_URL`: origen publico del frontend, por ejemplo `https://nombre-del-frontend.vercel.app`, sin `/api` ni barra final.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`: necesarias para las funciones que envian correo.

Despues de agregar o cambiar variables en Vercel, realizar un nuevo deployment para que se apliquen.

El frontend debe apuntar a la URL publica del backend agregando `/api`, por ejemplo:

```env
VITE_API_URL=https://nombre-del-backend.vercel.app/api
```

## Ventas manuales y funciones en standby

El flujo activo para la gestion del ERP es el de ventas manuales, incluyendo `POST /api/sales`.

El checkout publico para invitados y las rutas de pagos estan temporalmente desactivados en `src/routes/sale.routes.ts` y `src/app.ts`. La implementacion relacionada se conserva para poder retomarla; su presencia en el repositorio no significa que esos endpoints esten habilitados.

El backend usa cookies con credenciales y CORS. `FRONTEND_URL` debe coincidir con el origen real del frontend para que el navegador pueda comunicarse con la API.

## Mercado Pago y limpieza de reservas

La integracion de Mercado Pago queda en standby para la etapa actual:

- Las rutas `/api/payments` no estan montadas en Express.
- La ruta `POST /api/sales/guest-checkout` esta desactivada.
- No configurar ni depender de `MP_ACCESS_TOKEN` para el funcionamiento actual del ERP.

`src/services/cleanup.service.ts` contiene una tarea que busca ventas web pendientes con stock reservado y expirado. Cuando se ejecutaba, devolvia el stock, cancelaba la venta y rechazaba su transaccion asociada. El arranque local de esa tarea esta desactivado y no debe considerarse un cron de Vercel: la tarea usaba un temporizador en un proceso Node persistente.

Al reactivar el checkout y Mercado Pago:

1. Volver a habilitar las rutas de pago y checkout solo despues de probar el flujo completo.
2. Elegir un mecanismo de vencimiento compatible con el alojamiento (por ejemplo, un cron con la frecuencia adecuada o un proceso persistente).
3. Configurar de forma segura las credenciales y la URL publica del webhook.
4. Probar concurrencia entre vencimiento y notificacion de pago, liberacion de stock, pagos tardios y estados de venta.

El plan gratuito Hobby de Vercel limita la frecuencia de Cron Jobs; no asumir que permite ejecutar esta limpieza cada minuto. Revisar los limites vigentes antes de elegir la solucion.

## Seguridad de configuracion

- `.env` y las credenciales no deben subirse a Git ni compartirse en mensajes.
- Si una credencial se expone, revocarla o rotarla y actualizar el valor en Vercel y en los entornos locales correspondientes.
- `MP_ACCESS_TOKEN` y `JWT_SECRET` son secretos del backend; nunca deben incluirse en el frontend.

---

Desarrollado para el ecosistema **ElementAll**.
