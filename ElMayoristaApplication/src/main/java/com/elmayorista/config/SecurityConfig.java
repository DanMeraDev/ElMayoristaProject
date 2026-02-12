package com.elmayorista.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import com.elmayorista.auth.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuración de seguridad de la aplicación
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    public SecurityConfig(JwtFilter jwtFilter, CustomAccessDeniedHandler accessDeniedHandler) {
        this.jwtFilter = jwtFilter;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    /**
     * Configura la cadena de filtros de seguridad HTTP.
     * Aquí se definen las reglas de autorización para los endpoints.
     * 
     * @param http El objeto HttpSecurity para configurar.
     * @return La cadena de filtros de seguridad construida.
     * @throws Exception Si ocurre un error durante la configuración.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // Deshabilitar CSRF para APIs REST
                .csrf(AbstractHttpConfigurer::disable)
                // Configurar política de sesión sin estado (stateless) para JWT
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Definir las reglas de autorización para cada ruta.
                .authorizeHttpRequests(authorize -> authorize
                        // Permitir acceso público a todos los endpoints de autenticación (login, register, logout, etc.)
                        .requestMatchers("/api/auth/**").permitAll()
                        // Permitir acceso a la documentación de la API
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // Permitir acceso público a los archivos subidos (comprobantes)
                        .requestMatchers("/uploads/**").permitAll()
                        // Proteger los endpoints de administración. Solo usuarios con rol ADMIN pueden
                        // acceder.
                        .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                        // Proteger los endpoints de sellers. Solo usuarios con rol SELLER pueden
                        // acceder.
                        .requestMatchers("/api/sellers/**").hasAuthority("SELLER")
                        // Proteger los endpoints de soporte. Allow any authenticated user.
                        // The controller handles user-specific logic via @AuthenticationPrincipal
                        .requestMatchers("/api/support/**").authenticated()
                        .requestMatchers("/api/fiados/admin/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/fiados/**").authenticated()
                        .requestMatchers("/api/customers/admin/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/customers/**").authenticated()
                        .requestMatchers("/api/customer-fiados/admin/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/customer-fiados/**").authenticated()
                        .requestMatchers("/api/notifications/test-trigger").hasAuthority("ADMIN")
                        .requestMatchers("/api/notifications/**").authenticated()
                        // Permitir acceso al endpoint de subida de reportes a usuarios autenticados
                        .requestMatchers(HttpMethod.POST, "/api/reports/upload-report").authenticated()
                        // Todas las demás peticiones deben estar autenticadas.
                        .anyRequest().authenticated())
                // Manejo de excepciones de seguridad
                .exceptionHandling(exception -> exception
                        .accessDeniedHandler(accessDeniedHandler))
                // Agregar filtro JWT antes del filtro de autenticación de usuario/contraseña
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
