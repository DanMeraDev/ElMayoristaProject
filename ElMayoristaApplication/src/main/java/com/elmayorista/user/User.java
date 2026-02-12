package com.elmayorista.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    @Email(message = "El correo electrónico debe ser válido")
    @NotBlank(message = "El correo electrónico es obligatorio")
    private String email;

    @Column(nullable = false)
    @NotBlank(message = "La contraseña es obligatoria")
    @JsonIgnore
    private String password;

    @Column(name = "full_name")
    @NotBlank(message = "El nombre completo es obligatorio")
    private String fullName;

    @Column(name = "phone_number", unique = true)
    @jakarta.validation.constraints.Pattern(regexp = "^09\\d{8}$", message = "El número de teléfono debe tener 10 dígitos y comenzar con 09")
    private String phoneNumber;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Set<Role> roles = new HashSet<>();

    @Column(nullable = false)
    private boolean enabled = true;

    /**
     * Indica si el usuario requiere aprobación por parte de un administrador.
     * 
     * Este campo es especialmente relevante para los usuarios con rol SELLER:
     * - true: El seller se ha registrado pero aún no ha sido aprobado por un
     * administrador.
     * En este estado, el seller no puede registrar ventas ni acceder a todas las
     * funcionalidades.
     * 
     * - false: El seller ya ha sido aprobado por un administrador y puede utilizar
     * todas las funcionalidades del sistema correspondientes a su rol.
     * 
     * Los administradores (ADMIN) siempre tienen este valor en false porque no
     * requieren
     * aprobación para acceder al sistema.
     */
    @Column(name = "pending_approval")
    @Builder.Default
    private boolean pendingApproval = true;

    @Column(name = "commission_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal commissionPercentage = new BigDecimal("5.00");

    /**
     * Indica si el vendedor puede solicitar productos a crédito para sí mismo.
     * El monto se descontará de sus comisiones.
     */
    @Column(name = "can_credit_self")
    @Builder.Default
    private Boolean canCreditSelf = false;

    /**
     * Indica si el vendedor puede otorgar crédito a clientes/usuarios.
     */
    @Column(name = "can_credit_customers")
    @Builder.Default
    private Boolean canCreditCustomers = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "reset_password_token")
    @JsonIgnore
    private String resetPasswordToken;

    @Column(name = "reset_password_token_expiry")
    private LocalDateTime resetPasswordTokenExpiry;
}
