package com.elmayorista.customer;

import com.elmayorista.fiado.FiadoStatus;
import com.elmayorista.notification.NotificationService;
import com.elmayorista.user.User;
import com.elmayorista.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerFiadoService {

    private final CustomerFiadoRepository customerFiadoRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public CustomerFiadoDTO createCustomerFiado(UUID sellerId, Long customerId, String itemName, BigDecimal price) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new EntityNotFoundException("Vendedor no encontrado"));

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado"));

        if (customer.getStatus() != CustomerStatus.APPROVED) {
            throw new IllegalStateException("Solo se puede fiar a clientes aprobados");
        }

        CustomerFiado fiado = CustomerFiado.builder()
                .customer(customer)
                .seller(seller)
                .itemName(itemName)
                .price(price)
                .status(FiadoStatus.PENDING)
                .build();

        fiado = customerFiadoRepository.save(fiado);
        log.info("Customer fiado created: {} for customer {} by seller {}", fiado.getId(), customer.getFullName(), seller.getFullName());

        notificationService.notifyAdminsCustomerFiadoCreated(fiado);

        return toDTO(fiado);
    }

    @Transactional(readOnly = true)
    public List<CustomerFiadoDTO> getSellerCustomerFiados(UUID sellerId) {
        return customerFiadoRepository.findBySellerIdOrderByCreatedAtDesc(sellerId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerFiadoDTO> getAllCustomerFiados() {
        return customerFiadoRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerFiadoDTO adminApproveCustomerFiado(Long id) {
        CustomerFiado fiado = customerFiadoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Fiado de cliente no encontrado"));
        if (fiado.getStatus() != FiadoStatus.PENDING) {
            throw new IllegalStateException("Solo se pueden aprobar fiados pendientes");
        }
        fiado.setStatus(FiadoStatus.APPROVED);
        fiado = customerFiadoRepository.save(fiado);
        notificationService.notifySellerFiadoApproved(fiado.getSeller(), fiado.getId(), fiado.getItemName(), true, fiado.getCustomer().getFullName());
        log.info("Customer fiado {} approved by admin", id);
        return toDTO(fiado);
    }

    @Transactional
    public void adminRejectCustomerFiado(Long id) {
        CustomerFiado fiado = customerFiadoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Fiado de cliente no encontrado"));
        if (fiado.getStatus() != FiadoStatus.PENDING) {
            throw new IllegalStateException("Solo se pueden rechazar fiados pendientes");
        }
        fiado.setStatus(FiadoStatus.REJECTED);
        customerFiadoRepository.save(fiado);
        notificationService.notifySellerFiadoRejected(fiado.getSeller(), fiado.getId(), fiado.getItemName(), true, fiado.getCustomer().getFullName());
        log.info("Customer fiado {} rejected by admin", id);
    }

    @Transactional
    public void adminDeleteCustomerFiado(Long id) {
        CustomerFiado fiado = customerFiadoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Fiado de cliente no encontrado"));
        customerFiadoRepository.delete(fiado);
        log.info("Customer fiado {} deleted by admin", id);
    }

    private CustomerFiadoDTO toDTO(CustomerFiado fiado) {
        return CustomerFiadoDTO.builder()
                .id(fiado.getId())
                .customerName(fiado.getCustomer().getFullName())
                .customerId(fiado.getCustomer().getId())
                .sellerName(fiado.getSeller().getFullName())
                .itemName(fiado.getItemName())
                .price(fiado.getPrice())
                .status(fiado.getStatus())
                .settledInCycle(fiado.isSettledInCycle())
                .createdAt(fiado.getCreatedAt())
                .build();
    }
}
