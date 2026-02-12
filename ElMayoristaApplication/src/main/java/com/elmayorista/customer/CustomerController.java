package com.elmayorista.customer;

import com.elmayorista.dto.CustomerDTO;
import com.elmayorista.user.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    public ResponseEntity<CustomerDTO> registerCustomer(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        UUID sellerId = userDetails.getUser().getId();

        String fullName = request.get("fullName");
        String idNumber = request.get("idNumber");
        String phoneNumber = request.get("phoneNumber");

        log.info("Seller {} registering customer: {}", sellerId, fullName);

        CustomerDTO customer = customerService.registerCustomer(sellerId, fullName, idNumber, phoneNumber);
        return ResponseEntity.ok(customer);
    }

    @GetMapping("/approved")
    public ResponseEntity<List<CustomerDTO>> getApprovedCustomers() {
        return ResponseEntity.ok(customerService.getApprovedCustomers());
    }

    // ===== Admin endpoints =====

    @GetMapping("/admin/all")
    public ResponseEntity<List<CustomerDTO>> getAllCustomers() {
        log.info("Admin fetching all customers");
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/admin/pending")
    public ResponseEntity<List<CustomerDTO>> getPendingCustomers() {
        log.info("Admin fetching pending customers");
        return ResponseEntity.ok(customerService.getPendingCustomers());
    }

    @PostMapping("/admin/{id}/approve")
    public ResponseEntity<CustomerDTO> approveCustomer(@PathVariable Long id) {
        log.info("Admin approving customer {}", id);
        return ResponseEntity.ok(customerService.approveCustomer(id));
    }

    @PostMapping("/admin/{id}/reject")
    public ResponseEntity<Void> rejectCustomer(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        String reason = request.get("reason");
        log.info("Admin rejecting customer {} with reason: {}", id, reason);
        customerService.rejectCustomer(id, reason);
        return ResponseEntity.ok().build();
    }
}
