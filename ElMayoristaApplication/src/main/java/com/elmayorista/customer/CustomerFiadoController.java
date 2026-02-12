package com.elmayorista.customer;

import com.elmayorista.dto.CustomerFiadoDTO;
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
@RequestMapping("/api/customer-fiados")
@RequiredArgsConstructor
@Slf4j
public class CustomerFiadoController {

    private final CustomerFiadoService customerFiadoService;

    @PostMapping
    public ResponseEntity<CustomerFiadoDTO> createCustomerFiado(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID sellerId = userDetails.getUser().getId();

        Long customerId = Long.valueOf(request.get("customerId").toString());
        String itemName = (String) request.get("itemName");
        BigDecimal price = new BigDecimal(request.get("price").toString());

        log.info("Seller {} creating fiado for customer {}: {} - ${}", sellerId, customerId, itemName, price);

        CustomerFiadoDTO fiado = customerFiadoService.createCustomerFiado(sellerId, customerId, itemName, price);
        return ResponseEntity.ok(fiado);
    }

    @GetMapping("/my-fiados")
    public ResponseEntity<List<CustomerFiadoDTO>> getMyCustomerFiados(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID sellerId = userDetails.getUser().getId();

        log.info("Fetching customer fiados for seller {}", sellerId);

        List<CustomerFiadoDTO> fiados = customerFiadoService.getSellerCustomerFiados(sellerId);
        return ResponseEntity.ok(fiados);
    }

    // ===== Admin endpoints =====

    @GetMapping("/admin/all")
    public ResponseEntity<List<CustomerFiadoDTO>> getAllCustomerFiados() {
        log.info("Admin fetching all customer fiados");
        return ResponseEntity.ok(customerFiadoService.getAllCustomerFiados());
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> adminDeleteCustomerFiado(@PathVariable Long id) {
        log.info("Admin deleting customer fiado {}", id);
        customerFiadoService.adminDeleteCustomerFiado(id);
        return ResponseEntity.ok().build();
    }
}
