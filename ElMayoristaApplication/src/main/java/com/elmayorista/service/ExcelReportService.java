package com.elmayorista.service;

import com.elmayorista.sale.Sale;
import com.elmayorista.user.User;
import com.elmayorista.user.UserService;
import com.elmayorista.sale.SaleService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExcelReportService {

    private final SaleService saleService;
    private final UserService userService;

    public ByteArrayInputStream generateSettlementReport() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            // Estilos
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            // 1. Pestaña de Resumen General
            createGeneralSummarySheet(workbook, headerStyle);
            
            // 2. Pestañas por Vendedor
            List<User> vendors = userService.getAllVendors();
            for (User vendor : vendors) {
                createVendorSheet(workbook, vendor, headerStyle);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    private void createGeneralSummarySheet(Workbook workbook, CellStyle headerStyle) {
        Sheet sheet = workbook.createSheet("Resumen General");
        
        Row headerRow = sheet.createRow(0);
        String[] columns = {"ID Vendedor", "Nombre Vendedor", "Total Ventas", "Comisiones Pendientes", "Comisiones Aprobadas"};
        
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
        }
        
        List<User> vendors = userService.getAllVendors();
        int rowIdx = 1;
        
        for (User vendor : vendors) {
            Row row = sheet.createRow(rowIdx++);
            
            row.createCell(0).setCellValue(vendor.getId().toString());
            row.createCell(1).setCellValue(vendor.getFullName());
            
            // Obtener datos reales (optimizables en un futuro con queries personalizadas)
            List<Sale> sales = saleService.getSalesBySeller(vendor.getId(), Pageable.unpaged()).getContent();
            BigDecimal totalSales = sales.stream().map(Sale::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal pendingComm = sales.stream()
                    .filter(s -> s.getStatus().name().equals("PENDING") || s.getStatus().name().equals("UNDER_REVIEW"))
                    .map(Sale::getCommissionAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal approvedComm = sales.stream()
                    .filter(s -> s.getStatus().name().equals("APPROVED"))
                    .map(Sale::getCommissionAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

            row.createCell(2).setCellValue(totalSales.doubleValue());
            row.createCell(3).setCellValue(pendingComm.doubleValue());
            row.createCell(4).setCellValue(approvedComm.doubleValue());
        }
    }

    private void createVendorSheet(Workbook workbook, User vendor, CellStyle headerStyle) {
        // Limpiar nombre de la hoja (Excel tiene restricciones)
        String sheetName = vendor.getFullName().replaceAll("[^a-zA-Z0-9 ]", "");
        if (sheetName.length() > 30) sheetName = sheetName.substring(0, 30);
        
        Sheet sheet = workbook.createSheet(sheetName);
        
        Row headerRow = sheet.createRow(0);
        String[] columns = {"Fecha", "N° Orden", "Cliente", "Subtotal", "Envío", "Total", "Comisión %", "Monto Comisión", "Estado"};
        
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
        }
        
        List<Sale> sales = saleService.getSalesBySeller(vendor.getId(), Pageable.unpaged()).getContent();
        int rowIdx = 1;
        
        for (Sale sale : sales) {
            Row row = sheet.createRow(rowIdx++);
            
            row.createCell(0).setCellValue(sale.getOrderDate().toString());
            row.createCell(1).setCellValue(sale.getOrderNumber());
            row.createCell(2).setCellValue(sale.getCustomerName());
            row.createCell(3).setCellValue(sale.getSubtotal().doubleValue());
            row.createCell(4).setCellValue(sale.getShipping().doubleValue());
            row.createCell(5).setCellValue(sale.getTotal().doubleValue());
            row.createCell(6).setCellValue(sale.getCommissionPercentage().doubleValue());
            row.createCell(7).setCellValue(sale.getCommissionAmount().doubleValue());
            row.createCell(8).setCellValue(sale.getStatus().name());
        }
    }
}
