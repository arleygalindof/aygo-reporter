# Use pre-compiled JAR
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy pre-compiled JAR
COPY backend/upload-service/target/upload-service-1.0.0.jar app.jar

EXPOSE 2083

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:2083/api/upload/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
