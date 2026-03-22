FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./pom.xml
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY auth-service/pom.xml ./auth-service/pom.xml
COPY vehicle-service/pom.xml ./vehicle-service/pom.xml
COPY booking-service/pom.xml ./booking-service/pom.xml
COPY payment-service/pom.xml ./payment-service/pom.xml
COPY maintenance-service/pom.xml ./maintenance-service/pom.xml
COPY notification-service/pom.xml ./notification-service/pom.xml
RUN mvn dependency:go-offline -pl booking-service -am -B || true
COPY booking-service/src ./booking-service/src
RUN mvn package -pl booking-service -am -DskipTests -B

FROM eclipse-temurin:21-jre-alpine

# Security: Run as non-root user
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Copy the built JAR file from build stage
COPY --from=build /app/booking-service/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R spring:spring /app

# Switch to non-root user (Security best practice)
USER spring:spring

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8083/actuator/health || exit 1

EXPOSE 8083

# JVM tuning for containers
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]