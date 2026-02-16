package com.elmayorista.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting filter for authentication endpoints.
 * Uses a simple token bucket per IP address.
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int AUTH_MAX_REQUESTS = 10;
    private static final long AUTH_WINDOW_MS = 60_000; // 1 minute

    private static final int GENERAL_MAX_REQUESTS = 100;
    private static final long GENERAL_WINDOW_MS = 60_000;

    private final ConcurrentHashMap<String, RateBucket> authBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RateBucket> generalBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        boolean isAuthEndpoint = path.startsWith("/api/auth/");

        if (isAuthEndpoint) {
            if (!checkRate(authBuckets, clientIp, AUTH_MAX_REQUESTS, AUTH_WINDOW_MS)) {
                log.warn("Rate limit exceeded for auth endpoint from IP: {}", clientIp);
                sendTooManyRequests(response);
                return;
            }
        } else if (path.startsWith("/api/")) {
            if (!checkRate(generalBuckets, clientIp, GENERAL_MAX_REQUESTS, GENERAL_WINDOW_MS)) {
                log.warn("Rate limit exceeded for API from IP: {}", clientIp);
                sendTooManyRequests(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean checkRate(ConcurrentHashMap<String, RateBucket> buckets, String key,
                              int maxRequests, long windowMs) {
        long now = System.currentTimeMillis();

        // Cleanup old entries periodically (every 1000 checks)
        if (now % 1000 == 0) {
            buckets.entrySet().removeIf(e -> now - e.getValue().windowStart > windowMs * 2);
        }

        RateBucket bucket = buckets.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart > windowMs) {
                return new RateBucket(now);
            }
            return existing;
        });

        return bucket.count.incrementAndGet() <= maxRequests;
    }

    private void sendTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(
                "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Demasiadas solicitudes. Intenta de nuevo en un momento.\"}"
        );
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RateBucket {
        final long windowStart;
        final AtomicInteger count;

        RateBucket(long windowStart) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(0);
        }
    }
}
