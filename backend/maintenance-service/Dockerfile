FROM eclipse-temurin:21-jdk-alpine
VOLUME /tmp
COPY target/maintenance-service-1.0.0.jar maintenance-service.jar
ENTRYPOINT ["java","-jar","/maintenance-service.jar"]
