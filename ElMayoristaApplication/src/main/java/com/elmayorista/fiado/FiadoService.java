package com.elmayorista.fiado;

import com.elmayorista.dto.FiadoDTO;
import com.elmayorista.user.User;
import com.elmayorista.user.UserRepository;
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
public class FiadoService {

    private final FiadoRepository fiadoRepository;
    private final UserRepository userRepository;

    @Transactional
    public FiadoDTO createFiado(UUID sellerId, String itemName, BigDecimal price) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        Fiado fiado = Fiado.builder()
                .seller(seller)
                .itemName(itemName)
                .price(price)
                .status(FiadoStatus.PENDING)
                .build();

        fiado = fiadoRepository.save(fiado);
        log.info("Fiado created: {} by seller: {}", fiado.getId(), seller.getFullName());

        return toDTO(fiado);
    }

    public List<FiadoDTO> getSellerFiados(UUID sellerId) {
        return fiadoRepository.findBySellerIdOrderByCreatedAtDesc(sellerId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<Fiado> getUnsettledFiadosBySeller(User seller) {
        return fiadoRepository.findBySellerAndSettledInCycleFalse(seller);
    }

    @Transactional
    public void settleFiados(List<Fiado> fiados) {
        for (Fiado fiado : fiados) {
            fiado.setStatus(FiadoStatus.SETTLED);
            fiado.setSettledInCycle(true);
        }
        fiadoRepository.saveAll(fiados);
        log.info("Settled {} fiados", fiados.size());
    }

    @Transactional
    public void deleteFiado(Long id, UUID sellerId) {
        Fiado fiado = fiadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fiado not found"));

        if (!fiado.getSeller().getId().equals(sellerId)) {
            throw new RuntimeException("No tienes permiso para eliminar este fiado");
        }

        if (fiado.getStatus() != FiadoStatus.PENDING) {
            throw new RuntimeException("Solo se pueden eliminar fiados pendientes");
        }

        fiadoRepository.delete(fiado);
        log.info("Fiado {} deleted by seller {}", id, sellerId);
    }

    public List<FiadoDTO> getAllFiados() {
        return fiadoRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toAdminDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void adminDeleteFiado(Long id) {
        Fiado fiado = fiadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fiado no encontrado"));

        fiadoRepository.delete(fiado);
        log.info("Fiado {} deleted by admin", id);
    }

    private FiadoDTO toDTO(Fiado fiado) {
        return FiadoDTO.builder()
                .id(fiado.getId())
                .itemName(fiado.getItemName())
                .price(fiado.getPrice())
                .status(fiado.getStatus())
                .settledInCycle(fiado.isSettledInCycle())
                .createdAt(fiado.getCreatedAt())
                .build();
    }

    private FiadoDTO toAdminDTO(Fiado fiado) {
        return FiadoDTO.builder()
                .id(fiado.getId())
                .itemName(fiado.getItemName())
                .price(fiado.getPrice())
                .status(fiado.getStatus())
                .settledInCycle(fiado.isSettledInCycle())
                .createdAt(fiado.getCreatedAt())
                .sellerName(fiado.getSeller().getFullName())
                .sellerId(fiado.getSeller().getId().toString())
                .build();
    }
}
