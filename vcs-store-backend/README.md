# Docker Workflow — VC'S Store Backend

## 🐳 Docker Compose (recomendado)

Todos los comandos se ejecutan desde la **raíz del proyecto** (`C:\Projects\vcs-store`).

### Desarrollo (hot reload)

```bash
docker compose up -d backend
```

- El override monta tu código local como volumen
- uvicorn se reinicia automáticamente al guardar (--reload)
- No necesitás reconstruir la imagen en cada cambio

### Ver logs

```bash
docker compose logs -f backend
```

### Reconstruir (cuando cambiás requirements.txt o Dockerfile)

```bash
docker compose up -d --build backend
```

### Bajar

```bash
docker compose down
```

### Todo junto (backend + frontend)

```bash
docker compose up -d --build
```

> El frontend corre en `localhost:4200` servido por nginx.

---

## 📋 Referencia rápida de comandos

| Comando | Qué hace |
|---------|----------|
| `docker compose up -d backend` | Levanta solo backend con hot reload |
| `docker compose up -d` | Levanta backend + frontend |
| `docker compose down` | Baja todo |
| `docker compose logs -f` | Logs en tiempo real |
| `docker compose ps` | Estado de los servicios |
| `docker compose exec backend sh` | Terminal dentro del contenedor |
| `docker compose up -d --build` | Reconstruye y levanta |

---

## 📦 Guía completa de Docker Compose

Ver `DOCKER-COMPOSE.md` en la raíz del proyecto para:
- Explicación línea por línea de cada archivo
- Multi-stage build
- docker-compose.override.yml
- Diferencia entre docker run y Compose
