package com.elmayorista.customer;

import com.elmayorista.user.User;
import com.elmayorista.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    @Transactional
    public CustomerDTO registerCustomer(UUID sellerId, String fullName, String idNumber, String phoneNumber) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Vendedor no encontrado"));

        if (idNumber != null && !idNumber.isBlank() && customerRepository.existsByIdNumber(idNumber)) {
            throw new RuntimeException("Ya existe un cliente con esa cedula");
        }

        Customer customer = Customer.builder()
                .fullName(fullName)
                .idNumber(idNumber)
                .phoneNumber(phoneNumber)
                .status(CustomerStatus.PENDING)
                .registeredBy(seller)
                .build();

        customer = customerRepository.save(customer);
        log.info("Customer registered: {} by seller: {}", customer.getId(), seller.getFullName());

        return toDTO(customer);
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> getApprovedCustomers() {
        return customerRepository.findByStatusOrderByFullNameAsc(CustomerStatus.APPROVED)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> getPendingCustomers() {
        return customerRepository.findByStatus(CustomerStatus.PENDING)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerDTO approveCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        if (customer.getStatus() != CustomerStatus.PENDING) {
            throw new RuntimeException("Solo se pueden aprobar clientes pendientes");
        }

        customer.setStatus(CustomerStatus.APPROVED);
        customer.setRejectionReason(null);
        customer = customerRepository.save(customer);
        log.info("Customer {} approved", id);

        return toDTO(customer);
    }

    @Transactional
    public void rejectCustomer(Long id, String reason) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        if (customer.getStatus() != CustomerStatus.PENDING) {
            throw new RuntimeException("Solo se pueden rechazar clientes pendientes");
        }

        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("Se requiere un motivo de rechazo");
        }

        customer.setStatus(CustomerStatus.REJECTED);
        customer.setRejectionReason(reason);
        customerRepository.save(customer);
        log.info("Customer {} rejected: {}", id, reason);
    }

    private CustomerDTO toDTO(Customer customer) {
        return CustomerDTO.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .idNumber(customer.getIdNumber())
                .phoneNumber(customer.getPhoneNumber())
                .status(customer.getStatus())
                .rejectionReason(customer.getRejectionReason())
                .registeredByName(customer.getRegisteredBy().getFullName())
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
