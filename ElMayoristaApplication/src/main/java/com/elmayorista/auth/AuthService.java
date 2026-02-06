package com.elmayorista.auth;

import com.elmayorista.user.Role;
import com.elmayorista.user.User;
import com.elmayorista.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * Registra un nuevo usuario en el sistema
     * 
     * @param request Datos de registro
     * @return Respuesta con datos del usuario registrado
     */
    public AuthResponse register(RegisterRequest request) {
        // Crear usuario con los datos del request
        User user = User.builder()
                .email(request.getEmail())
                .password(request.getPassword())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .roles(request.getRoles() != null ? request.getRoles() : new HashSet<>())
                .build();

        // Si no se especifica ningún rol, asignar SELLER por defecto
        if (user.getRoles().isEmpty()) {
            user.getRoles().add(Role.SELLER);
        }

        // Registrar el usuario mediante el servicio de usuarios
        User registeredUser = userService.registerUser(user);

        // Generar token para auto-login
        UserDetails userDetails = userService.loadUserByUsername(registeredUser.getEmail());
        String jwt = jwtUtil.generateToken(userDetails);

        // Construir y devolver la respuesta
        return AuthResponse.builder()
                .userId(registeredUser.getId())
                .email(registeredUser.getEmail())
                .fullName(registeredUser.getFullName())
                .roles(registeredUser.getRoles())
                .pendingApproval(registeredUser.isPendingApproval())
                .token(jwt)
                .message("Usuario registrado exitosamente")
                .build();
    }

    /**
     * Autentica a un usuario existente
     * 
     * @param request Credenciales de login
     * @return Respuesta con datos del usuario autenticado
     */
    public AuthResponse login(LoginRequest request) {
        try {
            // Cargar detalles del usuario
            UserDetails userDetails = userService.loadUserByUsername(request.getEmail());

            // Verificar que la contraseña sea correcta
            if (!passwordEncoder.matches(request.getPassword(), userDetails.getPassword())) {
                throw new BadCredentialsException("Contraseña incorrecta");
            }

            // Verificar si el usuario está habilitado
            if (!userDetails.isEnabled()) {
                throw new BadCredentialsException("Tu cuenta ha sido deshabilitada. Contacta al administrador.");
            }

            // Autenticar al usuario
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            // Almacenar autenticación en el contexto de seguridad
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Obtener datos completos del usuario
            User user = userService.getUserByEmail(request.getEmail())
                    .orElseThrow(() -> new BadCredentialsException("Usuario no encontrado"));

            // Generar token JWT
            String jwt = jwtUtil.generateToken(userDetails);

            // Construir y devolver respuesta con el token
            return AuthResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .roles(user.getRoles())
                    .pendingApproval(user.isPendingApproval())
                    .token(jwt)
                    .message("Inicio de sesión exitoso")
                    .build();

        } catch (Exception e) {
            throw new BadCredentialsException("Credenciales inválidas: " + e.getMessage());
        }
    }

    /**
     * Solicita el restablecimiento de contraseña
     * 
     * @param email Email del usuario
     */
    public void requestPasswordReset(String email) {
        userService.initiatePasswordReset(email);
    }

    /**
     * Restablece la contraseña usando un token
     * 
     * @param token       Token de recuperación
     * @param newPassword Nueva contraseña
     */
    public void resetPassword(String token, String newPassword) {
        userService.completePasswordReset(token, newPassword);
    }
}