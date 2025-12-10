# Use pre-compiled JAR
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy pre-compiled JAR
COPY target/*.jar app.jar

EXPOSE 2081

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:2081/api/auth/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
