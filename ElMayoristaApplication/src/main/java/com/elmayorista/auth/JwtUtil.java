package com.elmayorista.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;


import com.elmayorista.user.Role;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    // Clave secreta para firmar el token (idealmente debe estar en un archivo de propiedades)
    @Value("${jwt.secret:8nQVnF7PLRdKLo3aYHlUI2NpjxceKPNSuYOcNKMfT48=}")
    private String secretKey;

    // Tiempo de expiración del token (24 horas)
    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    /**
     * Genera un token JWT para un usuario
     * @param userDetails Detalles del usuario
     * @return Token JWT generado
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Genera un token JWT con claims adicionales
     * @param extraClaims Claims adicionales para incluir en el token
     * @param userDetails Detalles del usuario
     * @return Token JWT generado
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        // Si userDetails implementa JwtUser, extraer roles
        if (userDetails instanceof JwtUser jwtUser) {
            Set<String> roles = jwtUser.getRoles().stream()
                    .map(Enum::name)
                    .collect(Collectors.toSet());
            extraClaims.put("roles", roles);
        }
        
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Verifica si un token es válido para un usuario específico
     * @param token Token a validar
     * @param userDetails Usuario contra el que validar
     * @return true si el token es válido
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    /**
     * Extrae el nombre de usuario (email) del token
     * @param token Token JWT
     * @return Nombre de usuario extraído
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extrae la fecha de expiración del token
     * @param token Token JWT
     * @return Fecha de expiración
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extrae un claim específico del token
     * @param token Token JWT
     * @param claimsResolver Función para extraer el claim
     * @return Claim extraído
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extrae todos los claims del token
     * @param token Token JWT
     * @return Claims extraídos
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Verifica si el token ha expirado
     * @param token Token JWT
     * @return true si el token ha expirado
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Obtiene la clave de firma a partir de la clave secreta
     * @return Clave de firma
     */
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
