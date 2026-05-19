# Docker Compose — Guía de Referencia

## ¿Qué es Docker Compose?

Es una herramienta para definir y ejecutar **múltiples contenedores Docker** con un solo archivo YAML.
En vez de escribir 6 comandos `docker build / docker run` separados, escribís un `docker-compose.yml`
y ejecutás **un solo comando** para levantar todo.

---

## Estructura del archivo

```yaml
services:            # ← lista de contenedores que forman tu app

  backend:           # ← nombre del servicio (también funciona como hostname en la red interna)
    build:
      context: ./vcs-store-backend   # ← carpeta con el Dockerfile y código
    container_name: vcs-backend      # ← nombre para docker ps / docker logs (opcional)
    ports:
      - "8000:8000"                  # ← HOST:CONTAINER — mapea puerto de tu PC al contenedor
    env_file:
      - ./vcs-store-backend/.env     # ← carga variables de entorno desde archivo
    restart: unless-stopped           # ← reinicio automático si se cae (ideal para prod)
    networks:
      - vcs-network                  # ← conecta a una red privada

  frontend:
    build:
      context: ./vcs-store-frontend
    container_name: vcs-frontend
    ports:
      - "4200:80"
    depends_on:
      - backend                      # ← espera a que backend arranque antes que frontend
    restart: unless-stopped
    networks:
      - vcs-network

networks:            # ← define las redes
  vcs-network:
    driver: bridge   # ← red privada tipo puente (aislada del host)
```

### Cada línea explicada

| Línea | Qué hace | Por qué |
|-------|----------|---------|
| `services:` | Inicia la lista de contenedores | Estructura base de Compose |
| `backend:` | Define un servicio llamado "backend" | El nombre se usa como hostname en la red interna |
| `build.context` | Carpeta donde buscar el Dockerfile | Le dice a Docker dónde está el código |
| `container_name` | Nombre fijo para el contenedor | Facilita logs (`docker logs vcs-backend`) |
| `ports: "8000:8000"` | Mapea host:container | `localhost:8000` → puerto 8000 del contenedor |
| `env_file` | Carga .env al contenedor | Sin esto, el backend no tiene credenciales |
| `restart: unless-stopped` | Reinicio automático | Si el proceso crashea, Docker lo levanta solo |
| `depends_on` | Orden de arranque | Frontend espera a que backend exista |
| `networks` | Conecta a red privada | Los servicios se ven por nombre (`backend:8000`) |
| `networks.driver: bridge` | Tipo de red | Aislada, los contenedores se comunican entre sí pero no con el exterior |

---

## Conceptos clave

### 1. `ports: "HOST:CONTAINER"`

```
 Puerto en tu PC → Puerto dentro del contenedor
 "4200:80"        → localhost:4200 apunta al puerto 80 del contenedor (nginx)
```

Sin esto, el contenedor corre pero no es accesible desde tu navegador.
Los contenedores en la misma red pueden comunicarse sin mapeo usando su nombre:
`backend:8000` desde el frontend funciona aunque no haya `ports`.

### 2. Servicios no-puerto

Si un servicio no necesita acceso desde el exterior (ej: una base de datos),
no le pongas `ports`. Solo los otros contenedores lo ven por nombre.

### 3. `depends_on` ≠ "está listo"

`depends_on` solo espera a que el contenedor **exista**, no a que la app dentro
responda. Para eso se usan **healthchecks**.

### 4. Redes

Todos los servicios en la misma red se resuelven por nombre de servicio:
- Desde frontend: `http://backend:8000`
- Desde backend: no necesita acceder al frontend

No necesitás `--link` ni `--network` como con `docker run`.

### 5. `restart: unless-stopped`

Modos comunes:
- `"no"` — no reiniciar (default)
- `always` — siempre reiniciar
- `unless-stopped` — reiniciar a menos que lo detengas explícitamente (recomendado)
- `on-failure` — solo si el proceso termina con error

---

## Comandos esenciales

| Comando | Qué hace | Equivalente sin Compose |
|---------|----------|------------------------|
| `docker compose up -d` | Construye y levanta todo | `docker build` + `docker run` (x servicios) |
| `docker compose down` | Baja todo y elimina redes | `docker stop` + `docker rm` (x servicios) |
| `docker compose up -d --build` | Reconstruye imágenes y levanta | `docker build --no-cache` + `docker run` |
| `docker compose logs -f` | Logs en tiempo real de todos | `docker logs -f` (x servicios) |
| `docker compose ps` | Estado de todos | `docker ps` (filtrado) |
| `docker compose exec backend sh` | Terminal dentro del contenedor | `docker exec -it` |
| `docker compose down -v` | Baja todo + elimina volúmenes | — |

---

## Multi-stage build (Frontend Dockerfile)

```dockerfile
# ETAPA 1: Compilación
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                       # ← instala dependencias exactas
COPY . .
RUN npm run build                # ← compila Angular → /app/dist/...

# ETAPA 2: Servir
FROM nginx:alpine
COPY --from=build /app/dist/vcs-store-front/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Por qué multi-stage

- **Stage 1 (build)**: necesita Node.js (~300MB) para compilar
- **Stage 2 (serve)**: solo necesita nginx (~30MB) para servir archivos estáticos

La imagen final pesa ~30MB en vez de ~300MB. En producción **nunca** necesitás Node.js.

### Caching de capas

Docker cachea cada instrucción del Dockerfile. Si no cambió `package.json`,
la capa `RUN npm ci` se reusa y no vuelve a instalar. Por eso se copian los
`package*.json` ANTES que el resto del código.

---

## `.dockerignore`

```dockerignore
node_modules
dist
.git
.gitignore
*.md
```

Sin este archivo, Docker envía **todo** el contenido de la carpeta al contexto de build.
En frontend, `node_modules` pesa cientos de MB. Con `.dockerignore`, el contexto
baja de ~200MB a ~7KB.

---

## Nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

La línea clave: `try_files $uri $uri/ /index.html`

Cuando el usuario navega a `/admin/productos`, nginx:
1. Busca el archivo `admin/productos` → no existe
2. Busca la carpeta `admin/productos/` → no existe
3. Sirve `index.html`

Angular lee la URL y renderiza la ruta correcta. Sin esto, nginx devuelve 404
en cualquier ruta que no sea `/`.

---

## Flujo de trabajo diario

```bash
# 1. Desarrollo
docker compose up -d --build backend   # solo backend (frontend lo corrés con npm run start)
npm run start                          # frontend en localhost:4200

# 2. Todo junto
docker compose up -d --build           # levanta backend + frontend
docker compose logs -f                 # monitoreás ambos

# 3. Producción (build estático)
docker compose up -d --build           # frontend build + nginx en un solo comando
```

---

## Diferencia entre `docker run` y Docker Compose

| Aspecto | `docker run` | Docker Compose |
|---------|-------------|----------------|
| N° de comandos | 1 por contenedor | 1 para todos |
| Redes | `docker network create` a mano | Automática |
| Dependencias | No existe | `depends_on` |
| Variables de entorno | `--env-file` en cada comando | `env_file:` centralizado |
| Recrear | `docker stop / rm / run` | `docker compose up -d` |
| Logs | `docker logs -f` (x separado) | `docker compose logs -f` (todos juntos) |
| Escalar | No (otro `docker run`) | `--scale backend=3` |
| Producción | Scripts manuales | Se extiende a Swarm/K8s |

---

## Paso natural: `docker-compose.override.yml` (Hot Reload)

### El problema

Cada vez que cambiás código en el backend, necesitás:
```bash
docker compose down
docker compose up -d --build   # rebuild completo → 30-60s
```

Esto mata tu productividad en desarrollo.

### La solución

`docker-compose.override.yml` extiende tu `docker-compose.yml` automáticamente.
Cuando ejecutás `docker compose up`, Docker **funde** ambos archivos. No necesitás
pasarlo como parámetro.

### El archivo

```yaml
# docker-compose.override.yml
services:
  backend:
    command:
      - uvicorn
      - app.main:app
      - --host
      - "0.0.0.0"
      - --port
      - "8000"
      - --reload          # ← reinicia automáticamente al detectar cambios
    volumes:
      - ./vcs-store-backend:/app   # ← monta tu código local dentro del contenedor
```

### Qué hace cada línea

| Línea | Qué hace |
|-------|----------|
| `command: ... --reload` | Sobrescribe el CMD del Dockerfile. `--reload` hace que uvicorn reinicie automáticamente cuando un archivo .py cambia |
| `volumes: ./vcs-store-backend:/app` | Monta tu carpeta local dentro del contenedor en `/app`. Cualquier cambio que hagas en tu editor se refleja INSTANTÁNEAMENTE dentro del contenedor |

### Cómo funciona

```
Tu editor (VS Code)                  Contenedor Docker
        │                                  │
        │  guardás backend/productos.py     │
        │─────────────────────────────────>│  (volumen: el archivo cambia dentro)
                                           │
                                           │  uvicorn --reload detecta el cambio
                                           │  → reinicia FastAPI (∼0.5s)
                                           │
        │  <http://localhost:8000>         │
        │─────────────────────────────────>│  responde con el código nuevo
                                           │  SIN reconstruir imagen
```

### Sin override vs con override

| Situación | Sin override | Con override |
|-----------|-------------|-------------|
| Cambiás código Python | `down` + `up --build` (30-60s) | Ctrl+S → reinicio automático (0.5s) |
| Agregás dependencia (requirements.txt) | `down` + `up --build` | Sigue siendo necesario rebuild |
| Cambiás .env | `down` + `up` | `down` + `up` (no cambia) |
| Producción | Usás solo `docker-compose.yml` | Usás solo `docker-compose.yml` (el override se ignora) |

### ¿Por qué el override no se usa en producción?

El override es un archivo **local**. Si hacés `git push`, no se sube al servidor
(ni debería). En producción deployás solo con `docker-compose.yml`, que tiene
la configuración estable sin hot reload ni monturas de código fuente.

### Pro tip: `--reload` + volúmenes en frontend

Podrías hacer lo mismo con el frontend para desarrollo:
```yaml
services:
  frontend:
    command: ["npx", "ng", "serve", "--host", "0.0.0.0", "--poll", "2000"]
    volumes:
      - ./vcs-store-frontend:/app
```

Pero en la práctica es más rápido correr `npm run start` local y solo dockerizar
el frontend para producción/preview.

---

## Referencia rápida de comandos

### Docker Compose (nuevo flujo — recomendado)

```bash
# Desarrollo diario
docker compose up -d backend             # Solo backend (hot reload con override)
docker compose up -d                     # Backend + Frontend
docker compose up -d --build             # Reconstruir imágenes y levantar
docker compose down                      # Bajar todo
docker compose logs -f                   # Logs de ambos servicios
docker compose logs -f backend           # Logs solo backend
docker compose ps                        # Estado de los servicios
docker compose exec backend sh           # Terminal dentro del contenedor
```

### Docker legacy (solo si no usás Compose)

```bash
# Construir
docker build -t vcs-store-backend .

# Correr
docker run -d -p 8000:8000 --env-file .env --name vcs-backend-container vcs-store-backend

# Detener / eliminar
docker stop vcs-backend-container
docker rm vcs-backend-container

# Logs
docker logs vcs-backend-container

# Listar contenedores
docker ps
docker ps -a
```

---

## ¿Qué comando usar en cada caso?

| Situación | Comando | Por qué |
|-----------|---------|---------|
| **Arrancar el proyecto por primera vez** | `docker compose up -d --build` | Construye imágenes y levanta todo |
| **Desarrollo — cambiás código Python** | `docker compose up -d backend` | Usa el override: hot reload + volumen. No necesita rebuild |
| **Desarrollo — frontend** | `npm run start` (local) | Hot reload nativo de Angular es más rápido que Docker |
| **Agregaste dependencia (npm / pip)** | `docker compose up -d --build` | Necesita reconstruir la imagen |
| **Cambiaste `.env`** | `docker compose down; docker compose up -d` | Las variables se leen al arrancar el contenedor |
| **Ver logs** | `docker compose logs -f` | Muestra backend + frontend en una terminal |
| **Ver solo backend** | `docker compose logs -f backend` | Menos ruido |
| **Previsualizar producción** | `docker compose up -d --build` | Build completo + nginx servirá el frontend |
| **Bajar todo** | `docker compose down` | Elimina containers + red |
| **Terminal dentro del backend** | `docker compose exec backend sh` | Para debuggear, ver archivos, etc. |
| **Solo legacy (sin override)** | `docker build` + `docker stop/rm/run` | Solo si no tenés `docker-compose.yml` |

### Árbol de decisión

```
¿Qué estás haciendo?
│
├── Desarrollo de código
│   ├── Backend (.py)      → docker compose up -d backend   (hot reload)
│   └── Frontend (.ts)     → npm run start                  (ng serve local)
│
├── Cambiaste dependencias
│   ├── requirements.txt   → docker compose up -d --build
│   └── package.json       → docker compose up -d --build
│
├── Cambiaste .env
│   └── docker compose down; docker compose up -d
│
├── Probás producción
│   └── docker compose up -d --build
│
└── Terminaste de trabajar
    └── docker compose down
```

### Regla de oro

> **Si cambiás código fuente**: `docker compose up -d backend` (no hace rebuild, usa override)
>
> **Si cambiás configuración** (Dockerfile, requirements, package.json, .env): `docker compose up -d --build` (rebuild obligatorio)
