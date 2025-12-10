# Build stage
FROM maven:3.9.5-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copia pom.xml y descarga dependencias
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copia el código fuente
COPY src ./src

# Compila la aplicación
RUN mvn clean package -DskipTests -q

# Production stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copia el JAR del stage anterior
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 2082

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:2082/api/data/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
