package com.elmayorista.verification;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/verification")
@Slf4j
public class VerificationController {

    private static final String WEBSERVICES_URL = "https://webservices.ec/api";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${webservices.api.token}")
    private String webservicesToken;

    // ─── Cédula (validación matemática, sin API de pago) ──────────────────────

    @GetMapping("/cedula/{cedula}")
    public ResponseEntity<?> verifyCedula(@PathVariable String cedula) {
        EcuadorIdValidator.ValidationResult result = EcuadorIdValidator.validateCedula(cedula);
        log.info("Cedula validation [{}]: valid={}", cedula, result.valid());
        return ResponseEntity.ok(Map.of("valid", result.valid(), "type", result.type()));
    }

    // ─── RUC (validación matemática, sin API de pago) ─────────────────────────

    @GetMapping("/ruc/{ruc}")
    public ResponseEntity<?> verifyRuc(@PathVariable String ruc) {
        EcuadorIdValidator.ValidationResult result = EcuadorIdValidator.validateRuc(ruc);
        log.info("RUC validation [{}]: valid={}", ruc, result.valid());
        return ResponseEntity.ok(Map.of("valid", result.valid(), "type", result.type()));
    }

    // ─── WhatsApp ─────────────────────────────────────────────────────────────

    @GetMapping("/whatsapp/{phone}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> verifyWhatsapp(@PathVariable String phone) {
        try {
            String url = WEBSERVICES_URL + "/checkwhatsapp/" + phone;
            HttpHeaders headers = acceptJson();
            headers.setBearerAuth(webservicesToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            Map<String, Object> body = response.getBody();
            Map<String, Object> data = (Map<String, Object>) body.get("data");

            return ResponseEntity.ok(Map.of("status", data.get("status")));
        } catch (HttpStatusCodeException e) {
            String msg = extractError(e, "No se pudo verificar el número de WhatsApp");
            log.warn("WhatsApp verification failed [{}] {}: {}", phone, e.getStatusCode(), msg);
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", msg));
        } catch (Exception e) {
            log.error("Error verifying WhatsApp [{}]: {}", phone, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "Error al conectar con el servicio de verificación"));
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private HttpHeaders acceptJson() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    @SuppressWarnings("unchecked")
    private String extractError(HttpStatusCodeException e, String fallback) {
        try {
            Map<String, Object> body = objectMapper.readValue(e.getResponseBodyAsString(), Map.class);
            Object err = body.get("error");
            if (err instanceof String s && !s.isBlank()) return s;
            // Zampisoft wraps errors in "data.error" too sometimes
            if (body.get("data") instanceof Map<?,?> data) {
                Object dataErr = ((Map<String, Object>) data).get("error");
                if (dataErr instanceof String s && !s.isBlank()) return s;
            }
        } catch (Exception ignored) {}
        return fallback;
    }
}
