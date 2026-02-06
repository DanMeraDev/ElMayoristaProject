package com.elmayorista.auth;

import com.elmayorista.dto.ForgotPasswordRequest;
import com.elmayorista.dto.ResetPasswordRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    /**
     * Endpoint para iniciar sesión
     * @param request Credenciales de login
     * @return Información del usuario autenticado
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    
    /**
     * Endpoint para registrar un nuevo usuario
     * @param request Datos de registro
     * @return Información del usuario registrado
     */
    @PostMapping("/register") 
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * Solicita un correo de recuperación de contraseña
     * @param request Contiene el email del usuario
     * @return Mensaje de éxito
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Si el correo existe, se enviarán las instrucciones."));
    }

    /**
     * Restablece la contraseña con el token recibido
     * @param request Contiene token y nueva contraseña
     * @return Mensaje de éxito
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Contraseña restablecida exitosamente."));
    }
}
