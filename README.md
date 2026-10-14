# DOM en Linea - Municipalidad de La Cisterna

Sistema de tramitacion digital para la Direccion de Obras Municipales (DOM) de La Cisterna.

Permite a los vecinos ingresar solicitudes de permisos y certificados, adjuntar documentacion tecnica o planos en formato PDF y realizar seguimiento del estado mediante numero de folio. Para los funcionarios municipales, provee una intranet protegida por autenticacion con bandeja de entrada, asignacion de expedientes y avance secuencial por fases.

| Componente | Tecnologia | Puerto local |
|---|---|---|
| **Backend API** | FastAPI + SQLAlchemy + PostgreSQL | `http://localhost:8001` (documentacion en `/docs`) |
| **Frontend Web** | React 19 + TypeScript + Vite | `http://localhost:5173` |

> **Nota:** La configuracion inicial incluye datos de prueba para desarrollo local (cuentas de funcionarios de ejemplo, tipos de tramite del catalogo y solicitudes demo).

---

## Estructura del proyecto

```
.
├── backend/            # API FastAPI + PostgreSQL
│   ├── app/            # Modelos, routers, esquemas Pydantic y seed
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/           # Aplicacion React + Vite (portal ciudadano e intranet)
│   ├── src/
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml  # Orquestacion de BD, API y cliente web
```

---

## Despliegue con Docker Compose (Recomendado)

Es el metodo mas directo tanto en Linux como en macOS o Windows con Docker Desktop:

```bash
# 1. Construir e iniciar contenedores
docker compose up --build -d

# 2. Inicializar tablas de la base de datos
docker compose exec api python -m app.create_tables

# 3. Cargar catalogo inicial (16 tipos de tramite, 7 funcionarios y 118 fases)
docker compose exec api python -m app.seed
```

Accesos locales:
- **Portal ciudadano e Intranet:** `http://localhost:5173`
- **Documentacion interactiva de la API:** `http://localhost:8001/docs`

Comandos utiles de administracion:
```bash
docker compose logs -f     # Ver logs en tiempo real
docker compose down        # Detener contenedores (mantiene volumen de base de datos)
```

---

## Instalacion local sin Docker

Requiere Python 3.11+, Node.js 18+ y PostgreSQL 16 configurado localmente.

### 1. Base de datos

Crear base de datos y usuario:
```bash
psql -U postgres -c "CREATE USER dom_user WITH PASSWORD 'dom_pass_2026';"
psql -U postgres -c "CREATE DATABASE dom_municipal OWNER dom_user;"
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Inicializar esquema y catalogo
export DATABASE_URL_SYNC="postgresql://dom_user:dom_pass_2026@localhost:5432/dom_municipal"
python -m app.create_tables
python -m app.seed

# Ejecutar servidor de desarrollo
export DATABASE_URL="postgresql+asyncpg://dom_user:dom_pass_2026@localhost:5432/dom_municipal"
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Frontend

En una terminal separada:
```bash
cd frontend
npm install
npm run dev
```

El portal estara disponible en `http://localhost:5173`. El proxy configurado en Vite redirige las peticiones `/api` al backend en el puerto 8001.

---

## Cuentas de prueba (Intranet)

Contrasena compartida para entorno de pruebas: `dom2026`

| RUT | Departamento | Rol |
|---|---|---|
| `11111111-1` | DOTECAP | ejecutor |
| `22222222-2` | DOTECAP | visor |
| `33333333-3` | Edificacion | ejecutor |
| `44444444-4` | Urbanismo e Inspeccion | ejecutor |
| `55555555-5` | Ejecucion | ejecutor |
| `66666666-6` | Oficina Impuesto Territorial | ejecutor |
| `77777777-7` | Direccion de Obras | admin |

---

## Flujo de tramitacion y estados

1. **Ingreso ciudadano (`/`):** El usuario ingresa un nuevo expediente con sus datos basicos, direccion y seleccion de tramite. El sistema asigna un folio correlativo (ej. `DOM-2026-001`) y permite adjuntar planos o documentos PDF.
2. **Consulta de estado (`/estado`):** Permite verificar en cualquier momento el estado actual del expediente y las observaciones registradas utilizando el folio.
3. **Gestion funcionaria (`/login/funcionarios`):** El funcionario asignado revisa el expediente en su bandeja, examina los archivos adjuntos y avanza el expediente fase a fase o emite observaciones para subsanacion.

### Logica de transicion de fases

El catalogo modela el flujo administrativo de la DOM con 16 tramites y 118 fases distribuidas entre las unidades tecnicas.

- `estado_actual`: Estado global de la solicitud (`Ingresado`, `En Revision`, `En Correccion`, `Finalizado`).
- `fase_actual`: Hito especifico dentro del procedimiento reglamentario correspondiente al tipo de tramite.

Endpoint de transicion: `PUT /api/solicitudes/{id}/flujo`

| Accion | Estado previo | Efecto |
|---|---|---|
| `iniciar` | `Ingresado` | Pasa a `En Revision` en la primera fase del tramite. |
| `avanzar` | `En Revision` | Completa la fase actual y avanza a la siguiente; en la ultima fase finaliza el tramite. |
| `observar` | `En Revision` | Cambia a `En Correccion` conservando la fase para posterior reingreso. |
| `reingresar` | `En Correccion` | Retorna a `En Revision` tras el ingreso de correcciones por parte del ciudadano. |

---

## Configuracion de entorno y notas tecnicas

- **Variables de entorno:** `SECRET_KEY` para tokens JWT y credenciales de PostgreSQL deben configurarse en variables de entorno o archivo `.env` en ambientes de produccion.
- **Almacenamiento de archivos:** Los documentos subidos se guardan localmente en el directorio definido por `STORAGE_DIR` (por defecto `backend/storage/`).
- **Pruebas automatizadas:** La suite de pruebas de integracion end-to-end se encuentra en `backend/test_e2e.py`.
