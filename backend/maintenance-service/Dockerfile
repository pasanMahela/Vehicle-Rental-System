FROM eclipse-temurin:21-jdk-alpine
VOLUME /tmp
COPY target/maintenance-service-0.0.1-SNAPSHOT.jar maintenance-service.jar
ENTRYPOINT ["java","-jar","/maintenance-service.jar"]
