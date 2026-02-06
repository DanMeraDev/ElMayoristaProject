package com.elmayorista.user;

import com.elmayorista.sale.Sale;
import com.elmayorista.sale.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SaleService saleService;

    /**
     * Obtiene todos los usuarios (paginado)
     * 
     * @param pageable Configuración de paginación
     * @return Página de usuarios
     */
    @GetMapping
    public ResponseEntity<Page<User>> getAllUsersPaginated(Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsersPaginated(pageable));
    }

    /**
     * Obtiene el perfil del usuario autenticado actualmente
     * 
     * @param userDetails Detalles del usuario desde el contexto de seguridad
     * @return El usuario actual
     */
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        return userService.getUserByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * Obtiene un usuario por su ID
     * 
     * @param id ID del usuario
     * @return El usuario encontrado
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * Obtiene las ventas de un usuario (vendedor)
     * 
     * @param id ID del usuario (vendedor)
     * @return Lista de ventas del usuario
     */
    @GetMapping("/{id}/sales")
    public ResponseEntity<Page<Sale>> getSellerSales(@PathVariable UUID id, Pageable pageable) {
        return ResponseEntity.ok(saleService.getSalesBySeller(id, pageable));
    }

    /**
     * Obtiene la comisión de un usuario (vendedor) para el mes actual
     * 
     * @param id ID del usuario (vendedor)
     * @return Comisión total del mes actual
     */
    @GetMapping("/{id}/commission")
    public ResponseEntity<BigDecimal> getSellerCommissionForCurrentMonth(@PathVariable UUID id) {
        return ResponseEntity.ok(saleService.getCommissionForSellerInCurrentMonth(id));
    }

    /**
     * Obtiene estadísticas detalladas de comisiones para un vendedor
     * 
     * @param id ID del usuario (vendedor)
     * @return Estadísticas de comisiones (ganadas, pendientes, en revisión)
     */
    @GetMapping("/{id}/commission-stats")
    public ResponseEntity<VendorCommissionStats> getVendorCommissionStats(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getVendorCommissionStats(id));
    }

    /**
     * Actualiza los datos de un usuario
     * 
     * @param id   ID del usuario a actualizar
     * @param user Datos actualizados
     * @return Usuario actualizado
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable UUID id, @Valid @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    /**
     * Elimina un usuario
     * 
     * @param id ID del usuario a eliminar
     * @return Respuesta sin contenido
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
