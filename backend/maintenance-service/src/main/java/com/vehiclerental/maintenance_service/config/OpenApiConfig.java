package com.vehiclerental.maintenance_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI maintenanceServiceOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Maintenance Service API")
                .description("Maintenance microservice for Orchid Vehicle Rental System. " +
                    "Handles issue reporting, maintenance scheduling, and vehicle service tracking.")
                .version("1.0.0")
                .contact(new Contact()
                    .name("Orchid Vehicle Rental Team")
                    .email("support@orchid-rental.com"))
                .license(new License()
                    .name("MIT")
                    .url("https://opensource.org/licenses/MIT")))
            .addServersItem(new Server()
                .url("http://localhost:8085")
                .description("Local Development Server"))
            .addServersItem(new Server()
                .url("http://api-gateway:8080")
                .description("API Gateway (Via Gateway)"))
            .addServersItem(new Server()
                .url("https://maintenance-service.azurecontainerapps.io")
                .description("Production Server (Azure Container Apps)"));
    }
}
