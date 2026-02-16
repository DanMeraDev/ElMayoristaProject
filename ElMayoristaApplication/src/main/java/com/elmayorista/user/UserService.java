package com.elmayorista.user;

import com.elmayorista.sale.SaleRepository;
import com.elmayorista.sale.SaleStatus;
import com.elmayorista.config.CacheConfig;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final SaleRepository saleRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.elmayorista.service.EmailService emailService;

    /**
     * Carga un usuario por su nombre de usuario (en este caso, el email).
     * Este método es utilizado por Spring Security para la autenticación.
     * 
     * @param email El email del usuario a buscar.
     * @return Un objeto UserDetails que Spring Security puede utilizar.
     * @throws UsernameNotFoundException si el usuario no se encuentra.
     */
    @Transactional
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));
        return new UserDetailsImpl(user);
    }

    @Transactional
    public User registerUser(User user) {
        // Verificar si el correo ya está registrado
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("El correo electrónico ya está registrado");
        }

        // Verificar si el teléfono ya está registrado
        if (user.getPhoneNumber() != null && userRepository.existsByPhoneNumber(user.getPhoneNumber())) {
            throw new IllegalArgumentException("El número de teléfono ya está registrado");
        }

        // Codificar la contraseña
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Si es seller, marcar como pendiente de aprobación
        if (user.getRoles().contains(Role.SELLER)) {
            user.setPendingApproval(true);
        } else {
            user.setPendingApproval(false);
        }

        return userRepository.save(user);
    }

    /**
     * Aprueba a un seller pendiente y envía un correo de notificación.
     * Este método orquesta la aprobación y el envío de correo.
     * 
     * @param userId ID del seller
     * @return Usuario actualizado
     */
    public User approveVendorAndSendEmail(UUID userId) {
        User savedUser = approveVendor(userId);

        // Enviar correo de notificación de forma asíncrona
        emailService.sendVendorApprovalEmail(savedUser.getEmail(), savedUser.getFullName());

        return savedUser;
    }

    /**
     * Aprueba a un seller pendiente (lógica transaccional)
     * 
     * @param userId ID del seller
     * @return Usuario actualizado
     */
    @Transactional
    private User approveVendor(UUID userId) {
        User user = getUserById(userId);

        // Verificar que sea un seller pendiente de aprobación
        if (!user.getRoles().contains(Role.SELLER) || !user.isPendingApproval()) {
            throw new IllegalStateException("El usuario no es un seller pendiente de aprobación");
        }

        user.setPendingApproval(false);
        user.setEnabled(true);

        return userRepository.save(user);
    }

    /**
     * Rechaza a un seller pendiente
     * 
     * @param userId ID del seller
     * @param reason Razón del rechazo
     * @return Usuario (podría eliminarse o marcarse como rechazado, aquí lo
     *         deshabilitamos)
     */
    @Transactional
    public void rejectVendor(UUID userId, String reason) {
        User user = getUserById(userId);

        if (!user.getRoles().contains(Role.SELLER) || !user.isPendingApproval()) {
            throw new IllegalStateException("El usuario no es un seller pendiente de aprobación");
        }

        // Opción 1: Eliminar usuario. Opción 2: Dejarlo inhabilitado.
        // Vamos a eliminarlo para que pueda volver a registrarse si corrige los
        // problemas
        // O podríamos marcarlo con un estado REJECTED si tuviéramos un enum de estado.
        // Dado el modelo actual, vamos a eliminarlo para limpiar, pero enviando correo
        // primero.

        emailService.sendVendorRejectionEmail(user.getEmail(), user.getFullName(), reason);

        userRepository.delete(user);
    }

    /**
     * Inicia el proceso de recuperación de contraseña
     * 
     * @param email Email del usuario
     */
    @Transactional
    public void initiatePasswordReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordTokenExpiry(java.time.LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            emailService.sendPasswordResetEmail(email, token);
        });
    }

    /**
     * Completa el proceso de recuperación de contraseña
     * 
     * @param token       Token de recuperación
     * @param newPassword Nueva contraseña
     */
    @Transactional
    public void completePasswordReset(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido"));

        if (user.getResetPasswordTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("El token ha expirado");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);
    }

    /**
     * Actualiza el porcentaje de comisión para un seller
     * 
     * @param userId               ID del seller
     * @param commissionPercentage Nuevo porcentaje de comisión
     * @return Usuario actualizado
     */
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.USERS_CACHE, key = "#userId"),
            @CacheEvict(value = CacheConfig.COMMISSION_STATS_CACHE, key = "#userId")
    })
    @Transactional
    public User updateVendorCommission(UUID userId, BigDecimal commissionPercentage) {
        User user = getUserById(userId);

        // Verificar que sea un seller
        if (!user.getRoles().contains(Role.SELLER)) {
            throw new IllegalStateException("El usuario no es un seller");
        }

        // Validar porcentaje de comisión
        if (commissionPercentage.compareTo(BigDecimal.ZERO) < 0 ||
                commissionPercentage.compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("El porcentaje de comisión debe estar entre 0 y 100");
        }

        user.setCommissionPercentage(commissionPercentage);

        return userRepository.save(user);
    }

    /**
     * Obtiene los sellers pendientes de aprobación
     * 
     * @return Lista de sellers pendientes
     */
    @Transactional(readOnly = true)
    public List<User> getPendingVendors() {
        return userRepository.findByRoleAndEnabled(Role.SELLER, false);
    }

    /**
     * Cuenta los sellers pendientes de aprobación
     * 
     * @return Cantidad de sellers pendientes
     */
    @Transactional(readOnly = true)
    public long countPendingVendors() {
        return userRepository.countByRoleAndEnabled(Role.SELLER, false);
    }

    /**
     * Obtiene las estadísticas de comisiones para un seller
     * 
     * @param vendorId ID del seller
     * @return Objeto con las estadísticas de comisiones
     */
    @Cacheable(value = CacheConfig.COMMISSION_STATS_CACHE, key = "#vendorId")
    @Transactional(readOnly = true)
    public VendorCommissionStats getVendorCommissionStats(UUID vendorId) {
        User vendor = getUserById(vendorId);

        if (!vendor.getRoles().contains(Role.SELLER)) {
            throw new IllegalStateException("El usuario no es un seller");
        }

        // Queries agregadas en vez de cargar todas las ventas en memoria
        BigDecimal earnedCommission = saleRepository.sumCommissionBySellerAndStatusAndSettled(
                vendor, SaleStatus.APPROVED, false);
        BigDecimal receivedCommission = saleRepository.sumCommissionBySellerAndStatusAndSettled(
                vendor, SaleStatus.APPROVED, true);
        BigDecimal pendingReviewCommission = saleRepository.sumCommissionBySellerAndStatus(
                vendor, SaleStatus.UNDER_REVIEW);
        BigDecimal pendingPaymentCommission = saleRepository.sumCommissionBySellerAndStatus(
                vendor, SaleStatus.PENDING);

        long totalSales = saleRepository.countBySeller(vendor);
        long approvedCount = saleRepository.countBySellerAndStatus(vendor, SaleStatus.APPROVED);
        long underReviewCount = saleRepository.countBySellerAndStatus(vendor, SaleStatus.UNDER_REVIEW);
        long pendingCount = saleRepository.countBySellerAndStatus(vendor, SaleStatus.PENDING);

        return VendorCommissionStats.builder()
                .vendorId(vendorId)
                .earnedCommission(earnedCommission)
                .receivedCommission(receivedCommission)
                .pendingReviewCommission(pendingReviewCommission)
                .pendingPaymentCommission(pendingPaymentCommission)
                .totalSalesCount((int) totalSales)
                .approvedSalesCount((int) approvedCount)
                .underReviewSalesCount((int) underReviewCount)
                .pendingSalesCount((int) pendingCount)
                .commissionPercentage(vendor.getCommissionPercentage())
                .build();
    }

    /**
     * Obtiene estadísticas globales para el panel de administración
     * 
     * @return Objeto con estadísticas globales del sistema
     */
    @Cacheable(CacheConfig.DASHBOARD_STATS_CACHE)
    @Transactional(readOnly = true)
    public AdminDashboardStats getAdminDashboardStats() {
        long pendingVendors = countPendingVendors();
        long totalVendors = userRepository.countByRoleAndEnabled(Role.SELLER, true);
        long pendingSales = saleRepository.countByStatus(SaleStatus.PENDING);
        long underReviewSales = saleRepository.countByStatus(SaleStatus.UNDER_REVIEW);

        BigDecimal totalApprovedSales = saleRepository.sumTotalByStatus(SaleStatus.APPROVED);
        if (totalApprovedSales == null) {
            totalApprovedSales = BigDecimal.ZERO;
        }

        return AdminDashboardStats.builder()
                .pendingVendorsCount(pendingVendors)
                .totalVendorsCount(totalVendors)
                .pendingSalesCount(pendingSales)
                .underReviewSalesCount(underReviewSales)
                .totalApprovedSales(totalApprovedSales)
                .build();
    }

    // Métodos básicos de CRUD

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<User> getAllUsersPaginated(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<User> getAllVendors() {
        return userRepository.findByRole(Role.SELLER);
    }

    @Transactional(readOnly = true)
    public Page<User> getAllVendorsPaginated(Pageable pageable) {
        return userRepository.findByRole(Role.SELLER, pageable);
    }

    /**
     * Habilita o deshabilita a un seller.
     * Un seller deshabilitado no puede acceder a la plataforma.
     * 
     * @param userId  ID del seller
     * @param enabled true para habilitar, false para deshabilitar
     * @return Usuario actualizado
     */
    @Transactional
    public User toggleSellerEnabled(UUID userId, boolean enabled) {
        User user = getUserById(userId);

        if (!user.getRoles().contains(Role.SELLER)) {
            throw new IllegalStateException("El usuario no es un seller");
        }

        user.setEnabled(enabled);
        return userRepository.save(user);
    }

    @Cacheable(value = CacheConfig.USERS_CACHE, key = "#id")
    @Transactional(readOnly = true)
    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + id));
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @CacheEvict(value = CacheConfig.USERS_CACHE, key = "#id")
    @Transactional
    public User updateUser(UUID id, User updatedUser) {
        User existingUser = getUserById(id);

        // Validar unicidad del teléfono si ha cambiado
        if (updatedUser.getPhoneNumber() != null &&
                !updatedUser.getPhoneNumber().equals(existingUser.getPhoneNumber()) &&
                userRepository.existsByPhoneNumber(updatedUser.getPhoneNumber())) {
            throw new IllegalArgumentException("El número de teléfono ya está registrado");
        }

        // Actualizar campos permitidos
        existingUser.setFullName(updatedUser.getFullName());
        existingUser.setPhoneNumber(updatedUser.getPhoneNumber());
        existingUser.setEnabled(updatedUser.isEnabled());

        // No permitir cambios en correo ni roles por este método

        return userRepository.save(existingUser);
    }

    /**
     * Actualiza los permisos de crédito de un vendedor
     * 
     * @param userId  ID del vendedor
     * @param request DTO con los permisos a actualizar
     * @return Usuario actualizado
     */
    @CacheEvict(value = CacheConfig.USERS_CACHE, key = "#userId")
    @Transactional
    public User updateSellerPermissions(UUID userId, UpdatePermissionsRequest request) {
        User user = getUserById(userId);

        // Verificar que sea un seller
        if (!user.getRoles().contains(Role.SELLER)) {
            throw new IllegalStateException("El usuario no es un vendedor");
        }

        // Actualizar permisos si se proporcionan
        if (request.getCanCreditSelf() != null) {
            user.setCanCreditSelf(request.getCanCreditSelf());
        }
        if (request.getCanCreditCustomers() != null) {
            user.setCanCreditCustomers(request.getCanCreditCustomers());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(UUID id) {
        // Verificar que el usuario existe
        getUserById(id);
        userRepository.deleteById(id);
    }
}