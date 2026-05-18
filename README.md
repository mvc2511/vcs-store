# 🐳 Docker Workflow — VC'S Store Backend

Guía práctica de comandos para desarrollo, debugging y mantenimiento del backend en FastAPI usando Docker.

---

## 🛠️ 1. Comandos de HOY (Desarrollo Diario)

Estos son los comandos que usarás cada vez que:

- Agregues un feature
- Modifiques código en FastAPI
- Cambies variables en el archivo `.env`

### 🔁 Ciclo clásico de reinicio (Combo de 3)

Ejecuta estos comandos en orden para reflejar cambios en tu aplicación:

```bash
# 0. Detener el contenedor
docker stop vcs-backend-container

# 1. Detiene y elimina el contenedor actual
docker rm -f vcs-backend-container

# 2. Reconstruye la imagen con el código actualizado
docker build -t vcs-store-backend .

# 3. Levanta un nuevo contenedor con variables de entorno
docker run -d -p 8000:8000 --env-file .env --name vcs-backend-container vcs-store-backend
```

---

### 📡 Monitoreo básico

```bash
# Contenedores en ejecución
docker ps

# Todos los contenedores (incluyendo detenidos)
docker ps -a

# Logs del contenedor
docker logs vcs-backend-container

# Logs en tiempo real (stream)
docker logs -f vcs-backend-container
```

---

## 🚀 2. Comandos del FUTURO (Optimización y Despliegue)

A medida que el proyecto crezca, estos comandos te ayudarán a mejorar tu flujo de trabajo.

---

### ⚡ Modo Espejo (Volumes)

Evita hacer `docker build` constantemente. Monta tu código local dentro del contenedor.

#### Windows (PowerShell)

```bash
docker run -d -p 8000:8000 -v ${PWD}:/app --env-file .env --name vcs-backend-container vcs-store-backend
```

#### Mac / Linux / Git Bash

```bash
docker run -d -p 8000:8000 -v $(pwd):/app --env-file .env --name vcs-backend-container vcs-store-backend
```

> Con esto, los cambios en tu código se reflejan automáticamente (ideal con `uvicorn --reload`).

---

### 🧠 Debugging: Acceder al contenedor

```bash
docker exec -it vcs-backend-container sh
```

Dentro del contenedor puedes usar:

```bash
ls
pwd
cat archivo.py
```

Para salir:

```bash
exit
```

---

### 🧹 Limpieza de disco

```bash
docker system prune -a
```

> ⚠️ Esto elimina imágenes y contenedores no utilizados.

---

## 📊 Flujo de Docker (Resumen)

```text
Tu Código (VS Code)
        │
        ▼  docker build
Imagen Docker (snapshot del código)
        │
        ▼  docker run
Contenedor Activo (app corriendo en http://localhost:8000)
```
