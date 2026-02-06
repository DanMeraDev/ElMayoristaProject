package com.elmayorista.auth;

import com.elmayorista.user.UserService;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro que intercepta todas las solicitudes para verificar y validar tokens
 * JWT
 */
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String requestURI = request.getRequestURI();

        // Bypass JWT filter for public paths
        if (requestURI.startsWith("/api/auth") ||
                requestURI.startsWith("/swagger-ui") ||
                requestURI.startsWith("/v3/api-docs") ||
                requestURI.startsWith("/uploads")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // Verificar si hay un header de autorización con formato Bearer
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extraer el token (eliminando "Bearer ")
        jwt = authHeader.substring(7);

        try {
            // Extraer el email del token
            userEmail = jwtUtil.extractUsername(jwt);

            // Si hay un email y no hay autenticación en el contexto
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Cargar los detalles del usuario
                UserDetails userDetails = userService.loadUserByUsername(userEmail);

                // Validar el token
                if (jwtUtil.isTokenValid(jwt, userDetails)) {
                    // Verificar si el usuario está habilitado
                    if (!userDetails.isEnabled()) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write(
                                "{\"error\":\"USER_DISABLED\",\"message\":\"Tu cuenta ha sido deshabilitada. Contacta al administrador.\"}");
                        return;
                    }

                    // Log de depuración
                    System.out.println("Token válido para usuario: " + userEmail);
                    System.out.println("Autoridades del usuario: " + userDetails.getAuthorities());

                    // Crear token de autenticación
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());

                    // Establecer detalles de autenticación
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    // Establecer autenticación en el contexto de seguridad
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (ExpiredJwtException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Token has expired");
            return;
        } catch (Exception e) {
            // En caso de error con el token, simplemente continuamos (no autenticamos)
            logger.error("Error al validar token JWT", e);
        }

        // Continuar con la cadena de filtros
        filterChain.doFilter(request, response);
    }
}
