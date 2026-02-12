package com.elmayorista.fiado;

import com.elmayorista.user.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/fiados")
@RequiredArgsConstructor
@Slf4j
public class FiadoController {

    private final FiadoService fiadoService;

    @PostMapping
    public ResponseEntity<FiadoDTO> createFiado(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID sellerId = userDetails.getUser().getId();

        String itemName = (String) request.get("itemName");
        BigDecimal price = new BigDecimal(request.get("price").toString());

        log.info("Creating fiado for seller {}: {} - ${}", sellerId, itemName, price);

        FiadoDTO fiado = fiadoService.createFiado(sellerId, itemName, price);
        return ResponseEntity.ok(fiado);
    }

    @GetMapping("/my-fiados")
    public ResponseEntity<List<FiadoDTO>> getMyFiados(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID sellerId = userDetails.getUser().getId();

        log.info("Fetching fiados for seller ID: {}", sellerId);

        List<FiadoDTO> fiados = fiadoService.getSellerFiados(sellerId);
        return ResponseEntity.ok(fiados);
    }

    // ===== Admin endpoints =====

    @GetMapping("/admin/all")
    public ResponseEntity<List<FiadoDTO>> getAllFiados() {
        log.info("Admin fetching all fiados");
        return ResponseEntity.ok(fiadoService.getAllFiados());
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> adminDeleteFiado(@PathVariable Long id) {
        log.info("Admin deleting fiado {}", id);
        fiadoService.adminDeleteFiado(id);
        return ResponseEntity.ok().build();
    }
}
