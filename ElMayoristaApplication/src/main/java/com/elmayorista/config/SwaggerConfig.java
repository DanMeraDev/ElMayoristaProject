package com.elmayorista.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de Swagger/OpenAPI para documentar la API
 */
@Configuration
public class SwaggerConfig {

    /**
     * Configura la documentación principal de la API usando OpenAPI 3.0
     * @return Objeto OpenAPI configurado
     */
    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "basicAuth";
        
        return new OpenAPI()
                .info(new Info()
                        .title("API de El Mayorista")
                        .version("1.0.0")
                        .description("API REST para la aplicación de ventas El Mayorista")
                        .contact(new Contact()
                                .name("Equipo de Desarrollo")
                                .email("info@elmayorista.com"))
                        .license(new License()
                                .name("Propietario")
                                .url("https://elmayorista.com")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("basic")));
    }
}
