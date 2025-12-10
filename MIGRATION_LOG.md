# 🚀 Migración a Nueva Arquitectura de Microservicios

## Estado: EN PROGRESO (FASE 1)

### ✅ Cambios Realizados:

#### 1. **Nuevos Servicios Creados**
- **Upload Service** (Puerto 2083) - Responsabilidad: CSV upload/parsing
- **Report Service** (Puerto 2084) - Responsabilidad: Gestión de reportes

#### 2. **Configuración Actualizada**
- docker-compose.yml: Agregados upload-service y report-service
- API Gateway (Nginx):
  - Nuevas rutas: `/api/upload/` y `/api/reports/`
  - Dual-write para `/api/data/csv/upload` (enruta a upload-service)
  - Data Service (2082) sigue activo como fallback

#### 3. **Estructura**
```
backend/
├── auth-service/          (SIN CAMBIOS - 2081)
├── data-service/          (MANTIENE - 2082, fallback)
├── upload-service/        (NUEVO - 2083)
└── report-service/        (NUEVO - 2084)
```

### 📊 Mapeo de Rutas (API Gateway)

| Endpoint | Servicio Nuevo | Servicio Viejo | Estado |
|----------|---|---|---|
| `/api/upload/csv/upload` | Upload (2083) | Data (2082) | ✅ Funcional |
| `/api/reports/*` | Report (2084) | Data (2082) | ✅ Funcional |
| `/api/data/*` | - | Data (2082) | ✅ Fallback |

### 🔄 Dual-Write Strategy

**Fase Actual (100% tráfico a nuevos servicios):**
```
Frontend → API Gateway (8000)
         ├→ Upload Service (2083) [CSV uploads]
         ├→ Report Service (2084) [Reports]
         ├→ Auth Service (2081) [Auth]
         └→ Data Service (2082) [DEPRECADO - fallback]
```

### ⚙️ Siguientes Pasos:

1. ✅ Levantar nuevos servicios
   ```bash
   docker-compose up -d --build upload-service report-service api-gateway
   ```

2. ✅ Tests de rutas:
   ```bash
   curl http://localhost:8000/api/upload/health
   curl http://localhost:8000/api/reports/health
   ```

3. ✅ Monitorear logs:
   ```bash
   docker logs dashboard-upload-service
   docker logs dashboard-report-service
   ```

4. ⏳ Validar data en MongoDB:
   - Ambos servicios leen mismo MongoDB (reports)
   - Verificar integridad

5. ⏳ Deprecar Data Service (después de 7 días)
   ```bash
   docker-compose down data-service
   ```

### 📝 Notas Importantes

- **MongoDB compartida:** Ambos servicios (nuevos + viejo) acceden misma BD
- **Sin duplicación de datos:** Solo routing diferente
- **Rollback fácil:** Data Service aún disponible si algo falla
- **CORS/Headers:** Manejados por backend (no duplicados en Nginx)

### 🔐 Health Endpoints

- Upload Service: `http://localhost:2083/api/upload/health`
- Report Service: `http://localhost:2084/api/reports/health`
- API Gateway: `http://localhost:8000/health`

### 📊 Bases de Datos

- PostgreSQL (auth-service): Sin cambios
- MongoDB (upload + report services): Compartida
- Redis (ambos): Cache compartida

---

**Creado:** 2025-12-08
**Estado:** Migración en progreso (FASE 1 - ESTRUCTURA)
