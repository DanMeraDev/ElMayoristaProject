package com.elmayorista.sale;

import com.elmayorista.payment.Payment;
import com.elmayorista.payment.PaymentStatus;
import com.elmayorista.user.User;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    @NotNull(message = "El vendedor es obligatorio")
    private User seller;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonManagedReference
    private List<SaleDetail> details = new ArrayList<>();

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonManagedReference(value="sale-payments")
    private List<Payment> payments = new ArrayList<>();

    @Column(unique = true)
    private String orderNumber;

    @Column(nullable = false)
    @NotBlank(message = "El nombre del cliente es obligatorio")
    private String customerName;

    @Column(name = "customer_id_number")
    private String customerIdNumber;

    @Column(name = "customer_address", columnDefinition = "TEXT")
    private String customerAddress;

    @Column(name = "customer_city")
    private String customerCity;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(nullable = false, precision = 12, scale = 2)
    @NotNull(message = "El subtotal es obligatorio")
    @Positive(message = "El subtotal debe ser positivo")
    private BigDecimal subtotal;

    @Column(precision = 12, scale = 2)
    @NotNull(message = "El costo de envío es obligatorio")
    @Builder.Default
    private BigDecimal shipping = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @NotNull(message = "El total es obligatorio")
    @Positive(message = "El total debe ser positivo")
    private BigDecimal total;

    @Column(precision = 12, scale = 2)
    @NotNull(message = "El monto de comisión es obligatorio")
    @Builder.Default
    private BigDecimal commissionAmount = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal commissionPercentage = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "sale_type", nullable = false)
    @Builder.Default
    private SaleType saleType = SaleType.STANDARD;

    @Column(name = "tv_serial_number")
    private String tvSerialNumber;

    @Column(name = "tv_model")
    private String tvModel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "El estado de la venta es obligatorio")
    @Builder.Default
    private SaleStatus status = SaleStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(nullable = false)
    @NotNull(message = "La fecha de pedido es obligatoria")
    private LocalDateTime orderDate;

    

    @Column(name = "report_pdf_url", columnDefinition = "TEXT")
    private String reportPdfUrl;

    private String rejectionReason;

    @Builder.Default
    private boolean commissionSettled = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}