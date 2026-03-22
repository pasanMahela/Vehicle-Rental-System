FROM eclipse-temurin:21-jre-alpine

# Security: Run as non-root user
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Copy the executable Spring Boot jar (avoid matching *.jar.original)
COPY target/maintenance-service-0.0.1-SNAPSHOT.jar app.jar

# Change ownership to non-root user
RUN chown -R spring:spring /app

# Switch to non-root user (Security best practice)
USER spring:spring

# Health check (adjust port if needed - check your application.properties)
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8085/actuator/health || exit 1

EXPOSE 8085

# JVM tuning for containers
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
