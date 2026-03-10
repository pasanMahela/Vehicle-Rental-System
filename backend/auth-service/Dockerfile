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
RUN mvn dependency:go-offline -pl auth-service -am -B || true
COPY auth-service/src ./auth-service/src
RUN mvn package -pl auth-service -am -DskipTests -B

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/auth-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
