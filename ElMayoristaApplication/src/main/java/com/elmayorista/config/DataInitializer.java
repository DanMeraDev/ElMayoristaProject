package com.elmayorista.config;

import com.elmayorista.sale.Sale;
import com.elmayorista.sale.SaleDetail;
import com.elmayorista.sale.SaleService;
import com.elmayorista.user.Role;
import com.elmayorista.user.User;
import com.elmayorista.user.UserRepository;
import com.elmayorista.user.UserService;
import com.elmayorista.auth.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Pageable;


/**
 * Inicializador de datos para la aplicación.
 * Se ejecuta al iniciar la aplicación y crea datos iniciales necesarios.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final SaleService saleService;
    private final JwtUtil jwtUtil;

    @Override
    public void run(String... args) throws Exception {
        // Crear usuario ADMIN si no existe
        if (!userRepository.existsByEmail("dm375211@gmail.com")) {
            User admin = User.builder()
                    .email("dm375211@gmail.com")
                    // ¡Usa una contraseña segura y cámbiala en producción!
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Administrador del Sistema")
                    .roles(Set.of(Role.ADMIN))
                    .enabled(true)
                    .pendingApproval(false) // Los administradores no necesitan aprobación
                    .build();
            userRepository.save(admin);
            System.out.println("Usuario administrador creado.");
        }
        
        User seller = null;
        // Crear usuario SELLER de ejemplo si no existe
        if (!userRepository.existsByEmail("seller@elmayorista.com")) {
            seller = User.builder()
                    .email("seller@elmayorista.com")
                    .password(passwordEncoder.encode("seller123"))
                    .fullName("Vendedor de Ejemplo")
                    .phoneNumber("0987654321")
                    .roles(Set.of(Role.SELLER))
                    .enabled(true)
                    .pendingApproval(false) // Este seller ya está aprobado
                    .build();
            userRepository.save(seller);
            System.out.println("Usuario seller creado.");
        }

        if (seller == null) {
            seller = userRepository.findByEmail("seller@elmayorista.com").orElse(null);
        }

        // Imprimir tokens para facilitar pruebas
        printToken("dm375211@gmail.com", "ADMIN");
        printToken("seller@elmayorista.com", "SELLER");


    }

    private void printToken(String email, String label) {
        try {
            UserDetails userDetails = userService.loadUserByUsername(email);
            String token = jwtUtil.generateToken(userDetails);
            System.out.println("TOKEN " + label + " (" + email + "): " + token);
        } catch (Exception e) {
            System.err.println("Error al generar token para " + email + ": " + e.getMessage());
        }
    }
}
