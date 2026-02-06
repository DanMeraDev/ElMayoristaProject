package com.elmayorista.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    // The secret key I just generated: 8nQVnF7PLRdKLo3aYHlUI2NpjxceKPNSuYOcNKMfT48=
    private String secretKey = "8nQVnF7PLRdKLo3aYHlUI2NpjxceKPNSuYOcNKMfT48=";
    private long expiration = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secretKey", secretKey);
        ReflectionTestUtils.setField(jwtUtil, "jwtExpiration", expiration);
    }

    @Test
    void testGenerateAndValidateToken() {
        UserDetails userDetails = new User("test@example.com", "password", Collections.emptyList());
        
        String token = jwtUtil.generateToken(userDetails);
        assertNotNull(token);
        
        assertTrue(jwtUtil.isTokenValid(token, userDetails));
        assertEquals("test@example.com", jwtUtil.extractUsername(token));
    }

    @Test
    void testTokenExpiration() {
        UserDetails userDetails = new User("test@example.com", "password", Collections.emptyList());
        String token = jwtUtil.generateToken(userDetails);
        
        Date expirationDate = jwtUtil.extractExpiration(token);
        assertNotNull(expirationDate);
        assertTrue(expirationDate.after(new Date()));
    }
}
