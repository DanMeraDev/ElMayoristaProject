package com.elmayorista.payment;

import com.elmayorista.dto.CreatePaymentRequest;
import com.elmayorista.dto.PaymentDTO;
import com.elmayorista.user.User;
import com.elmayorista.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final UserService userService;

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<PaymentDTO> addPayment(
            @RequestParam("saleId") Long saleId,
            @RequestParam("amount") BigDecimal amount,
            @RequestParam("paymentMethod") PaymentMethod paymentMethod,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userService.getUserByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setSaleId(saleId);
        request.setAmount(amount);
        request.setPaymentMethod(paymentMethod);
        request.setNotes(notes);

        PaymentDTO newPayment = paymentService.addPayment(request, file, currentUser);
        return new ResponseEntity<>(newPayment, HttpStatus.CREATED);
    }

    /**
     * Elimina un pago (solo si el vendedor es el dueño y el estado de la venta lo
     * permite)
     */
    @DeleteMapping("/{saleId}/payments/{paymentId}")
    public ResponseEntity<Void> deletePayment(
            @PathVariable Long saleId,
            @PathVariable Long paymentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userService.getUserByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        paymentService.deletePayment(paymentId, saleId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
