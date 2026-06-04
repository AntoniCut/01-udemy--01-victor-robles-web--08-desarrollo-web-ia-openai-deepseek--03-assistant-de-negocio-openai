# 03 - Assistant de Negocio con OpenAI

Asistente conversacional de negocio ("El PicoEsquina") implementado con **JavaScript**, **Node.js**, **Express** y la **Assistants API de OpenAI** (threads + runs). El frontend es un chat estático servido por el propio backend, y el backend expone un endpoint `POST /api/chatbot` que mantiene el contexto de la conversación por usuario reutilizando el mismo `thread` de OpenAI.

Repositorio: https://github.com/AntoniCut/01-udemy--01-victor-robles-web--08-desarrollo-web-ia-openai-deepseek--03-assistant-de-negocio-openai

---

## Tabla de contenidos

1. [Stack tecnologico](#stack-tecnologico)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Variables de entorno](#variables-de-entorno)
4. [Despliegue en local](#despliegue-en-local)
5. [Despliegue en produccion (VPS + Nginx)](#despliegue-en-produccion-vps--nginx)
6. [Endpoint API](#endpoint-api)
7. [Build de produccion con Gulp](#build-de-produccion-con-gulp)
8. [Licencia](#licencia)

---

## Stack tecnologico

- **Backend:** Node.js (ES Modules), Express 5, OpenAI Node SDK 6 (Assistants API).
- **Frontend:** HTML + CSS + JS estaticos servidos desde `public/`.
- **Build:** Gulp 5 (terser, clean-css, htmlmin) para generar `dist/`.
- **Dev server:** Nodemon.
- **Despliegue:** Nginx como reverse proxy + PM2 como process manager.

Dependencias principales (`package.json`):

| Paquete     | Version  | Uso                                  |
|-------------|----------|--------------------------------------|
| express     | ^5.2.1   | Servidor HTTP y middleware           |
| openai      | ^6.16.0  | SDK de OpenAI (Assistants API)       |
| dotenv      | ^17.2.3  | Carga de variables de entorno         |
| axios       | 1.8.1    | Cliente HTTP (utilidades internas)   |

---

## Estructura del proyecto

```
03-assistant-de-negocio-openai/
├── app.js                  # Servidor Express + endpoint /api/chatbot
├── gulpfile.js             # Tareas de build (minificacion, copia a dist/)
├── package.json
├── pnpm-lock.yaml
├── .env                    # Variables de entorno (NO subir al repo)
├── .env.example            # Plantilla de variables de entorno
├── .gitignore
├── jsconfig.json
├── public/                 # Frontend estatico
│   ├── index.html
│   └── assets/
│       ├── css/
│       ├── img/
│       └── js/
├── types/                  # Tipos JSDoc
└── productos-*.json        # Catalogos de productos del asistente
```

---

## Variables de entorno

Crea un archivo `.env` en la raiz del proyecto a partir de `.env.example`:

```env
# Puerto del servidor (en produccion, > 1024 para no necesitar root)
PORT=1113

# API key de OpenAI (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx

# ID del Assistant creado en OpenAI Platform (https://platform.openai.com/playground)
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxx
```

Notas:

- `OPENAI_API_KEY` es **obligatoria**. Sin ella, el endpoint devolvera `500`.
- `OPENAI_ASSISTANT_ID` es **obligatoria** (o se usara el valor por defecto del codigo).
- El archivo `.env` esta incluido en `.gitignore`. **No lo subas al repositorio**.

---

## Despliegue en local

### Requisitos

- Node.js >= 18 (recomendado 20 LTS o superior).
- npm (incluido con Node) o pnpm.

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/AntoniCut/01-udemy--01-victor-robles-web--08-desarrollo-web-ia-openai-deepseek--03-assistant-de-negocio-openai.git
cd 03-assistant-de-negocio-openai

# 2. Instalar dependencias
npm install
# o, si prefieres pnpm:
pnpm install

# 3. Crear el archivo .env (copia .env.example y rellena los valores)
cp .env.example .env
nano .env

# 4. Arrancar en modo desarrollo (con nodemon)
npm run start
# o en modo produccion simple:
npm run serve
```

La aplicacion estara disponible en:

```
http://localhost:1113/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/03-assistant-de-negocio-openai/
```

> El puerto por defecto del codigo es `3000`, pero este proyecto usa `1113` para evitar conflicto con otros proyectos del portfolio. Puedes cambiar `PORT` en `.env`.

---

## Despliegue en produccion (VPS + Nginx)

Arquitectura: **Nginx** (reverse proxy + SSL con Let's Encrypt) -> **Node.js** gestionado con **PM2** en el mismo VPS.

### 1. Subir el codigo al VPS

Con FileZilla, sube todo el contenido del proyecto (excepto `node_modules`, `.env` y `dist/`) a:

```
/var/www/udemy.antonydev.tech/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/03-assistant-de-negocio-openai
```

### 2. Instalar dependencias en el VPS (sin devDependencies)

Conecta por SSH y ejecuta:

```bash
cd /var/www/udemy.antonydev.tech/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/03-assistant-de-negocio-openai

# Crear el .env de produccion (con tus claves reales)
nano .env
#   PORT=1113
#   OPENAI_API_KEY=sk-proj-...
#   OPENAI_ASSISTANT_ID=asst_...

# Instalar solo dependencias de produccion
npm install --omit=dev
```

> Importante: en Linux, los puertos < 1024 requieren root. Usa `PORT=1113` o cualquier puerto >= 1024 para no necesitar privilegios.

### 3. Arrancar con PM2 (persiste al cerrar SSH)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Arrancar la app
pm2 start app.js --name assistant-openai

# Configurar arranque automatico tras reinicio del servidor
pm2 startup
pm2 save
```

Comandos utiles de PM2:

```bash
pm2 status                       # Ver estado
pm2 logs assistant-openai        # Ver logs en tiempo real
pm2 restart assistant-openai     # Reiniciar
pm2 stop assistant-openai        # Detener
pm2 delete assistant-openai      # Eliminar del registro
```

### 4. Configurar Nginx como reverse proxy

Edita el bloque `server` de tu vhost (`/etc/nginx/sites-available/udemy.antonydev.tech` o donde lo tengas) y añade una `location`:

```nginx
location ^~ /victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/03-assistant-de-negocio-openai {
    proxy_pass http://localhost:1113;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

> Usa `^~` para que Nginx no intente servir archivos estaticos directamente desde `root` antes de hacer proxy.

Recarga Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Verificar

```
https://udemy.antonydev.tech/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/03-assistant-de-negocio-openai/
```

---

## Endpoint API

### `POST /api/chatbot`

Recibe un mensaje del usuario, lo envia al Assistant de OpenAI y devuelve la respuesta manteniendo el contexto por `userId` (reutiliza el mismo `thread` de OpenAI).

**Request body:**

```json
{
  "message": "¿Que productos teneis en oferta?",
  "userId": "usuario-123"
}
```

**Respuesta 200 (exito):**

```json
{
  "success": true,
  "message": "Actualmente tenemos en oferta..."
}
```

**Respuesta 400 (mensaje vacio):**

```json
{
  "error": "Has mandado un mensaje vacio. La pregunta del usuario es requerida!!"
}
```

**Respuesta 500 (error interno / fallo de OpenAI):**

```json
{
  "error": "Error al generar respuesta del chatbot."
}
```

Tambien accesible en la ruta con prefijo:

```
POST /victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/03-assistant-de-negocio-openai/api/chatbot
```

---

## Build de produccion con Gulp

El proyecto incluye un `gulpfile.js` que genera una version minificada del frontend y copia el backend a `dist/`:

```bash
npm run build
```

Salida: carpeta `dist/` con HTML/CSS/JS minificados, `app.js` y un `package.json` minimo.

Para ejecutar el build:

```bash
npm run start:prod
```

---

## Licencia

ISC © AntonyDev
