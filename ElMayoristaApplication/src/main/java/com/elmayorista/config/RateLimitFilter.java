package com.elmayorista.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Rate limiting filter using Redis for reliable, distributed rate limiting.
 * Uses a simple counter per IP with TTL-based window expiration.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int AUTH_MAX_REQUESTS = 10;
    private static final Duration AUTH_WINDOW = Duration.ofMinutes(1);

    private static final int GENERAL_MAX_REQUESTS = 100;
    private static final Duration GENERAL_WINDOW = Duration.ofMinutes(1);

    private final StringRedisTemplate redisTemplate;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        boolean isAuthEndpoint = path.startsWith("/api/auth/");

        if (isAuthEndpoint) {
            if (!checkRate("rate:auth:" + clientIp, AUTH_MAX_REQUESTS, AUTH_WINDOW)) {
                log.warn("Rate limit exceeded for auth endpoint from IP: {}", clientIp);
                sendTooManyRequests(response);
                return;
            }
        } else if (path.startsWith("/api/")) {
            if (!checkRate("rate:api:" + clientIp, GENERAL_MAX_REQUESTS, GENERAL_WINDOW)) {
                log.warn("Rate limit exceeded for API from IP: {}", clientIp);
                sendTooManyRequests(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean checkRate(String key, int maxRequests, Duration window) {
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, window);
        }
        return count != null && count <= maxRequests;
    }

    private void sendTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", "60");
        response.getWriter().write(
                "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Demasiadas solicitudes. Por favor espera un momento antes de continuar.\"}"
        );
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
