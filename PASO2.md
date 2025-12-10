# PASO 2: Backend con Spring Boot (EN CONSTRUCCIÓN)

## Estado Actual

Se han creado **todos los archivos base** para:
- ✅ Auth Service (Spring Boot)
- ✅ Data Service (Spring Boot)
- ✅ PostgreSQL (Base de datos)
- ✅ Redis (Cache)
- ✅ docker-compose.yml actualizado

## Estructura Creada

```
backend/
├── auth-service/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/dashboard/auth/
│       ├── AuthServiceApplication.java
│       ├── controller/
│       │   └── AuthController.java
│       ├── service/
│       │   └── AuthService.java
│       ├── model/
│       │   └── User.java
│       └── repository/
│           └── UserRepository.java
│
├── data-service/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/dashboard/data/
│       ├── DataServiceApplication.java
│       ├── controller/
│       │   └── ReportController.java
│       ├── service/
│       │   └── ReportService.java
│       ├── model/
│       │   └── Report.java
│       └── repository/
│           └── ReportRepository.java

docker/
├── postgres/
│   ├── Dockerfile
│   └── init.sql
├── redis/
│   └── Dockerfile
```

## Configuraciones Incluidas

### Auth Service (Puerto 2081)
- Autenticación de usuarios
- Integración Auth0 (opcional)
- JWT tokens
- Base de datos: `dashboard_auth`

### Data Service (Puerto 2082)
- CRUD de reportes
- Gestión de datos
- Base de datos: `dashboard_data`

### PostgreSQL
- 2 bases de datos creadas automáticamente
- Tablas: `users` y `reports`
- Puerto: 5432

### Redis
- Cache de sesiones
- Puerto: 6379

## Puertos Utilizados

```
Frontend:     2080
Auth Service: 2081
Data Service: 2082
PostgreSQL:   5432
Redis:        6379
```

## Para Construir y Ejecutar

### Opción 1: Docker Compose (Recomendado)

```cmd
cd d:\Maestria\AYGO_FINAL\aygo-reporter

# Construir todas las imágenes
docker-compose build

# Ejecutar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Opción 2: Construir Servicios Java Localmente

```cmd
# Auth Service
cd backend/auth-service
mvn clean package

# Data Service
cd backend/data-service
mvn clean package
```

## Verificación

Una vez levantados los servicios:

```
✓ Frontend: http://localhost:2080
✓ Auth Service: http://localhost:2081/api/auth/health
✓ Data Service: http://localhost:2082/api/data/health
✓ PostgreSQL: localhost:5432
✓ Redis: localhost:6379
```

## Endpoints Disponibles

### Auth Service (`/api/auth`)
- `POST /login` - Login de usuarios
- `POST /register` - Registro de usuarios
- `GET /user/{id}` - Obtener usuario
- `GET /health` - Health check

### Data Service (`/api/data`)
- `POST /reports` - Crear reporte
- `GET /reports/user/{userId}` - Obtener reportes del usuario
- `GET /reports/{id}` - Obtener reporte específico
- `PUT /reports/{id}` - Actualizar reporte
- `DELETE /reports/{id}` - Eliminar reporte
- `GET /health` - Health check

## Próximos Pasos

1. Compilar y verificar que los servicios Java compilen sin errores
2. Levantar todos los contenedores con docker-compose
3. Probar los endpoints con Postman o similar
4. Luego integrar con el frontend

---

**ESTADO: PASO 2 - ARCHIVOS CREADOS, LISTOS PARA COMPILAR Y EJECUTAR**
