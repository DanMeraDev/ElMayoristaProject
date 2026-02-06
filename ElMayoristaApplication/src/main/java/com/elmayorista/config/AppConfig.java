package com.elmayorista.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuración general de la aplicación
 */
@Configuration
public class AppConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;
    /**
     * Define el encoder de contraseñas a utilizar en la aplicación
     * @return Instancia de BCryptPasswordEncoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Configura los manejadores de recursos estáticos.
     * Expone el directorio 'uploads' para que las imágenes de los comprobantes sean accesibles vía HTTP.
     * @param registry El registro de manejadores de recursos.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        String resourceLocation = "file:" + uploadPath.toString() + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }
}
