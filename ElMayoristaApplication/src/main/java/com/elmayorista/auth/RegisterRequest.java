package com.elmayorista.auth;

import com.elmayorista.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Debe proporcionar un email válido")
    private String email;
    
    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
    
    @NotBlank(message = "El nombre completo es obligatorio")
    private String fullName;
    
    @jakarta.validation.constraints.Pattern(regexp = "^09\\d{8}$", message = "El número de teléfono debe tener 10 dígitos y comenzar con 09")
    private String phoneNumber;
    
    private Set<Role> roles;
}
