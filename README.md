# 🏛️ DOM en Línea Municipal

Sistema de trámites de la Dirección de Obras en línea — **La Cisterna**.

Un ciudadano puede **ingresar un trámite** (permisos de edificación, certificados, subdivisión predial, etc.), adjuntar sus planos en PDF y **hacer seguimiento** por folio. Los **funcionarios** ingresan a una intranet con bandeja de trámites para revisar, editar y cambiar el estado de cada solicitud.

| Componente | Tecnología | Puerto |
|---|---|---|
| **API** (backend) | FastAPI + PostgreSQL | `http://localhost:8001` (docs en `/docs`) |
| **Portal web** (frontend) | React 19 + TypeScript + Vite | `http://localhost:5173` |

> ⚠️ **Datos demo:** todo el contenido son datos de ejemplo para desarrollo (funcionarios, RUT y credenciales de BD de prueba). NO usar en producción.

---

## 📁 Estructura del repositorio

```
.
├── backend/            # API FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/            # modelos, routeres, schemas, seed
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/           # Portal web React + Vite (portales ciudadano e intranet)
│   ├── src/
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml  # Ambiente completo (BD + API + web) en un comando
```

---

## 🐳 Opción A — Docker Compose (recomendada, la más fácil)

Solo necesitas **Docker** instalado (Docker Desktop o Docker Engine + compose).

```bash
# 1. Levantar BD + API + portal web
docker compose up --build -d

# 2. Primera vez: crear las tablas
docker compose exec api python -m app.create_tables

# 3. Primera vez: sembrar catálogo (13 tipos de trámite, 7 funcionarios, 92 fases)
docker compose exec api python -m app.seed
```

Abre en tu navegador:

- **Portal web:** http://localhost:5173
- **Documentación de la API:** http://localhost:8001/docs

Para ver los logs o detener:

```bash
docker compose logs -f     # ver en vivo
docker compose down        # detener (conserva los datos en el volumen)
```

---

## 🐧 Opción B — Instalación nativa (Linux / macOS)

Requiere: **Python 3.11+**, **Node.js 18+** y **PostgreSQL 16** corriendo.

### 1. Base de datos

```bash
# Crear la base y el usuario (ajusta a tu instalación de PostgreSQL)
psql -U postgres -c "CREATE USER dom_user WITH PASSWORD 'dom_pass_2026';"
psql -U postgres -c "CREATE DATABASE dom_municipal OWNER dom_user;"
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Crear tablas y sembrar datos (usa el conector síncrono → DATABASE_URL_SYNC)
export DATABASE_URL_SYNC="postgresql://dom_user:dom_pass_2026@localhost:5432/dom_municipal"
python -m app.create_tables
python -m app.seed

# Arrancar la API (usa el conector async → DATABASE_URL)
export DATABASE_URL="postgresql+asyncpg://dom_user:dom_pass_2026@localhost:5432/dom_municipal"
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

> Si tu PostgreSQL corre en otro puerto (ej. `5433`), cambia el puerto en las dos URLs.

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

El portal queda en http://localhost:5173 y el proxy de Vite redirige `/api` → `http://localhost:8001` automáticamente.

---

## 🔑 Credenciales demo (funcionarios)

Todos los funcionarios comparten la contraseña `dom2026`:

| RUT | Departamento | Rol |
|---|---|---|
| `11111111-1` | DOTECAP | ejecutor |
| `22222222-2` | DOTECAP | visor |
| `33333333-3` | Edificación | ejecutor |
| `44444444-4` | Urbanismo e Inspección | ejecutor |
| `55555555-5` | Ejecución | ejecutor |
| `66666666-6` | Oficina Impuesto Territorial | ejecutor |
| `77777777-7` | Dirección de Obras | admin |

---

## 🧪 Cómo probar el flujo completo

1. **Portal Ciudadano** (http://localhost:5173 → "Portal Ciudadano"): ingresa un trámite nuevo con un RUT cualquiera (ej. `12345678-5`), una dirección, y selecciona un tipo de trámite. Anota el **folio** que se genera (ej. `DOM-2026-001`) y adjunta un PDF.

   Para generar un PDF de prueba en Linux:
   ```bash
   printf '%%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%%%EOF\n' > /tmp/plano-prueba.pdf
   ```

2. **Seguimiento ciudadano** (http://localhost:5173 → "Consultar estado"): ingresa el folio y verás el estado del trámite sin necesidad de cuenta.

3. **Intranet de funcionarios** (http://localhost:5173 → "Intranet Funcionarios"): inicia sesión con `11111111-1` / `dom2026`, abre el trámite desde la bandeja, edítalo si quieres y cambia su estado (Ingresado → En Revisión → Aprobado, etc.). El ciudadano verá el nuevo estado al consultar su folio.

---

## 🔧 Notas de desarrollo

- **Migraciones:** el proyecto no usa Alembic; para cambios de esquema en BD existentes se ejecuta SQL manual (para un MVP está bien, documentado en la memoria del proyecto).
- **Secretos:** la `SECRET_KEY` de los JWT y las credenciales de BD tienen valores de desarrollo. En producción se sobrescriben con variables de entorno.
- **Uploads:** los PDFs se guardan en `backend/storage/` (configurable con `STORAGE_DIR`).
- **Tests:** existe una suite E2E en `backend/test_e2e.py` (usa `httpx`).