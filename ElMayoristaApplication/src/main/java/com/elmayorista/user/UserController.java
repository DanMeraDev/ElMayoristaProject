package com.elmayorista.user;

import com.elmayorista.sale.SaleDTO;
import com.elmayorista.sale.SaleService;
import com.elmayorista.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SaleService saleService;
    private final FileStorageService fileStorageService;

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
    public ResponseEntity<Page<SaleDTO>> getSellerSales(@PathVariable UUID id, Pageable pageable) {
        return ResponseEntity.ok(saleService.getSalesBySellerAsDTOs(id, pageable));
    }

    /**
     * Verifica si el vendedor puede registrar nuevas ventas.
     * Retorna blocked=true si tiene ventas PENDING+UNPAID con más de 24 horas sin comprobante.
     */
    @GetMapping("/{id}/sales/can-create")
    public ResponseEntity<Map<String, Object>> canSellerCreateSale(@PathVariable UUID id) {
        User seller = userService.getUserById(id);
        boolean blocked = saleService.isSellerBlockedFromNewSales(seller);
        long overdueCount = blocked ? saleService.countOverdueSalesForSeller(seller) : 0;
        return ResponseEntity.ok(Map.of(
                "canCreate", !blocked,
                "overdueCount", overdueCount
        ));
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
     * Actualiza los permisos de crédito de un vendedor
     * 
     * @param id      ID del vendedor
     * @param request DTO con los permisos a actualizar
     * @return Usuario actualizado
     */
    @PutMapping("/{id}/permissions")
    public ResponseEntity<User> updateSellerPermissions(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePermissionsRequest request) {
        return ResponseEntity.ok(userService.updateSellerPermissions(id, request));
    }

    /**
     * Obtiene el perfil público de un vendedor (visible para todos los autenticados)
     */
    @GetMapping("/{id}/profile")
    public ResponseEntity<ProfileDTO> getPublicProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getPublicProfile(id));
    }

    /**
     * Actualiza el perfil del usuario autenticado
     */
    @PutMapping("/me/profile")
    public ResponseEntity<User> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateProfileRequest request) {
        String email = userDetails.getUsername();
        User user = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return ResponseEntity.ok(userService.updateProfile(user.getId(), request));
    }

    /**
     * Sube/actualiza la foto de perfil del usuario autenticado
     */
    @PostMapping(value = "/me/profile-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadProfilePhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws IOException {
        String email = userDetails.getUsername();
        User user = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String url = fileStorageService.uploadFile(file, "profile-photos");
        userService.updateProfilePhoto(user.getId(), url);

        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * Sube/actualiza la foto de portada del usuario autenticado
     */
    @PostMapping(value = "/me/cover-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadCoverPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws IOException {
        String email = userDetails.getUsername();
        User user = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String url = fileStorageService.uploadFile(file, "cover-photos");
        userService.updateCoverPhoto(user.getId(), url);

        return ResponseEntity.ok(Map.of("url", url));
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
