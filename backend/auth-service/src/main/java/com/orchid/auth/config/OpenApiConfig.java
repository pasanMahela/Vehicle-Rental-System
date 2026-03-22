package com.orchid.auth.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI authServiceOpenAPI() {
        Server localServer = new Server();
        localServer.setUrl("http://localhost:8081");
        localServer.setDescription("Local Development Server");

        Server productionServer = new Server();
        productionServer.setUrl("https://auth-service.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io");
        productionServer.setDescription("Production Server (Azure Container Apps)");

        Contact contact = new Contact();
        contact.setName("Orchid Vehicle Rental Team");
        contact.setEmail("support@orchid-rental.com");

        License license = new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT");

        Info info = new Info()
                .title("Auth Service API")
                .version("1.0.0")
                .description("Authentication and Authorization microservice for Orchid Vehicle Rental System. " +
                        "Handles user registration, login, JWT token generation, and user management.")
                .contact(contact)
                .license(license);

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer, productionServer));
    }
}
