# Paso 1: Frontend en Contenedor Docker

## Resumen
Este paso containeriza el frontend React/Vite en un contenedor Docker usando Nginx en puerto 2080.

## Archivos Creados/Modificados

### 1. **Dockerfile** (Actualizado)
- **Stage 1 (Build)**: Compila el proyecto React con Vite
- **Stage 2 (Production)**: Sirve archivos estáticos con Nginx
- **Puerto**: 2080 (en lugar de 80)

### 2. **nginx.conf** (Nuevo)
- Configuración personalizada para servir la SPA
- Redirecciona todas las rutas a index.html (necesario para React Router)
- Compresión Gzip activada
- Caching para assets estáticos

### 3. **docker-compose.yml** (Nuevo)
- Orquesta el contenedor
- Define red local
- Configuración de healthcheck

### 4. **docker-run.bat** (Nuevo)
- Script para Windows para manejar Docker Compose
- Comandos: build, up, down, logs, rebuild, clean

### 5. **.env** (Nuevo)
- Variables de configuración centralizadas

### 6. **.dockerignore** (Nuevo)
- Excluye archivos innecesarios de la imagen

## Estructura Actual

```
aygo-reporter/
├── Dockerfile              ✓ (Actualizado)
├── nginx.conf              ✓ (Nuevo)
├── docker-compose.yml      ✓ (Nuevo)
├── docker-run.bat          ✓ (Nuevo)
├── .env                    ✓ (Nuevo)
├── .dockerignore           ✓ (Nuevo)
├── package.json
├── vite.config.ts
├── src/
├── public/
└── README.md
```

## Instrucciones para Ejecutar

### Prerequisitos
- Docker Desktop instalado y corriendo
- Estar en la carpeta `aygo-reporter`

### Pasos

1. **Construir la imagen**
```cmd
docker-run.bat build
```

2. **Levantar el contenedor**
```cmd
docker-run.bat up
```

3. **Verificar que funciona**
- Abrir: http://localhost:2080
- Deberías ver el dashboard

4. **Ver logs en tiempo real**
```cmd
docker-run.bat logs
```

5. **Detener**
```cmd
docker-run.bat down
```

## Puertos Utilizados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend (Nginx) | 2080 | http://localhost:2080 |

## Troubleshooting

### Error: "docker: command not found"
- Asegúrate que Docker Desktop esté instalado y corriendo

### Error: "Port 2080 already in use"
- Opción 1: Cambiar en `.env` el `FRONTEND_PORT` a otro puerto (ej: 2081)
- Opción 2: Liberar el puerto: `netstat -ano | findstr :2080` y matar el proceso

### El contenedor inicia pero la página no carga
- Verificar logs: `docker-run.bat logs`
- Reconstruir sin cache: `docker-run.bat rebuild`

## Qué Cambió

- ✅ Puerto cambió de 80 → 2080
- ✅ Output de Vite cambió de `build/` → `dist/`
- ✅ Ahora está containerizado
- ✅ Listo para escalar a microservicios

## Próximo Paso

Una vez que esto funcione correctamente:
1. Verificar que el dashboard carga sin errores
2. Probar que React Router funciona (navegar entre páginas)
3. Confirmar que los assets se cargan correctamente

**Luego crearemos:**
- Backend (Auth Service) - Spring Boot
- Otro servicio para datos - Spring Boot
- Bases de datos - PostgreSQL + Redis

---

**Estado: FASE 1 - Esperando confirmación de que funciona**
