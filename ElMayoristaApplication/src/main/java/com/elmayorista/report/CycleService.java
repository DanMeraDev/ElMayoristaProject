package com.elmayorista.report;

import com.elmayorista.dto.CycleDTO;
import com.elmayorista.payment.Payment;
import com.elmayorista.sale.Sale;
import com.elmayorista.sale.SaleRepository;
import com.elmayorista.sale.SaleStatus;
import com.elmayorista.service.FileStorageService;
import com.elmayorista.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing billing cycles.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CycleService {

    private final SaleRepository saleRepository;
    private final CycleRepository cycleRepository;
    private final FileStorageService fileStorageService;

    /**
     * Get current cycle statistics (pending to close).
     */
    public CycleDTO getCurrentCycleStats() {
        List<Sale> sales = saleRepository.findByStatusAndCommissionSettledFalse(SaleStatus.APPROVED);

        if (sales.isEmpty()) {
            return CycleDTO.builder()
                    .totalSales(BigDecimal.ZERO)
                    .totalCommissions(BigDecimal.ZERO)
                    .salesCount(0)
                    .status(CycleStatus.OPEN)
                    .build();
        }

        LocalDateTime startDate = sales.stream()
                .map(Sale::getOrderDate)
                .min(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());

        BigDecimal totalSales = sales.stream()
                .map(sale -> sale.getTotal() != null ? sale.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCommissions = sales.stream()
                .map(sale -> sale.getCommissionAmount() != null ? sale.getCommissionAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CycleDTO.builder()
                .startDate(startDate)
                .endDate(LocalDateTime.now())
                .totalSales(totalSales)
                .totalCommissions(totalCommissions)
                .salesCount(sales.size())
                .status(CycleStatus.OPEN)
                .build();
    }

    /**
     * Get all closed cycles.
     */
    public List<CycleDTO> getAllCycles() {
        return cycleRepository.findAllByOrderByEndDateDesc().stream()
                .map(this::toCycleDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific cycle by ID.
     */
    public CycleDTO getCycleById(Long id) {
        return cycleRepository.findById(id)
                .map(this::toCycleDTO)
                .orElse(null);
    }

    /**
     * Close the current billing cycle.
     * Marks all approved sales as commission settled and generates an Excel report.
     */
    @Transactional
    public byte[] closeCycle() throws IOException {
        // Fetch all approved sales that haven't been settled
        List<Sale> sales = saleRepository.findByStatusAndCommissionSettledFalse(SaleStatus.APPROVED);

        if (sales.isEmpty()) {
            log.warn("No sales to close for this cycle");
            throw new IllegalStateException("No hay ventas aprobadas para cerrar el ciclo");
        }

        // Calculate cycle dates and totals
        LocalDateTime startDate = sales.stream()
                .map(Sale::getOrderDate)
                .min(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());

        LocalDateTime endDate = LocalDateTime.now();

        BigDecimal totalSalesAmount = sales.stream()
                .map(sale -> sale.getTotal() != null ? sale.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCommissions = sales.stream()
                .map(sale -> sale.getCommissionAmount() != null ? sale.getCommissionAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Generate Excel Report
        byte[] excelReport = generateExcelReport(sales);

        // Upload Excel to cloud storage
        String filename = "Cierre_Ciclo_" + LocalDate.now() + ".xlsx";
        String excelUrl = fileStorageService.uploadBytes(
                excelReport,
                filename,
                "reports",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        // Create Cycle record
        Cycle cycle = Cycle.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalSales(totalSalesAmount)
                .totalCommissions(totalCommissions)
                .salesCount(sales.size())
                .excelReportUrl(excelUrl)
                .status(CycleStatus.CLOSED)
                .build();

        cycleRepository.save(cycle);
        log.info("Cycle closed successfully. Total sales: {}, Total commissions: {}", totalSalesAmount,
                totalCommissions);

        // Mark sales as settled
        for (Sale sale : sales) {
            sale.setCommissionSettled(true);
        }
        saleRepository.saveAll(sales);

        return excelReport;
    }

    /**
     * Convert Cycle entity to DTO.
     */
    private CycleDTO toCycleDTO(Cycle cycle) {
        return CycleDTO.builder()
                .id(cycle.getId())
                .startDate(cycle.getStartDate())
                .endDate(cycle.getEndDate())
                .totalSales(cycle.getTotalSales())
                .totalCommissions(cycle.getTotalCommissions())
                .salesCount(cycle.getSalesCount())
                .excelReportUrl(cycle.getExcelReportUrl())
                .status(cycle.getStatus())
                .createdAt(cycle.getCreatedAt())
                .build();
    }

    /**
     * Generate Excel report with summary sheet and individual seller sheets.
     */
    private byte[] generateExcelReport(List<Sale> sales) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {

            // ========== SUMMARY SHEET ==========
            Sheet summarySheet = workbook.createSheet("Resumen General");

            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle commissionStyle = createHighlightStyle(workbook, currencyStyle, IndexedColors.YELLOW);
            CellStyle toReceiveStyle = createHighlightStyle(workbook, currencyStyle, IndexedColors.LIGHT_BLUE);

            // Create Header Row for Summary
            Row headerRow = summarySheet.createRow(0);
            String[] headers = {
                    "VENDEDOR", "PERIODO", "TOTAL VENTAS SIN ENVÍO", "ENVÍO", "TOTAL VENTAS CON ENVÍO", "PORCENTAJE",
                    "GANANCIA DEL VENDEDOR"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Group sales by Seller
            Map<User, List<Sale>> salesBySeller = sales.stream()
                    .collect(Collectors.groupingBy(Sale::getSeller));

            int rowNum = 1;
            BigDecimal grandTotalSubtotal = BigDecimal.ZERO;
            BigDecimal grandTotalShipping = BigDecimal.ZERO;
            BigDecimal grandTotalTotal = BigDecimal.ZERO;
            BigDecimal grandTotalCommission = BigDecimal.ZERO;

            Locale spanishLocale = Locale.forLanguageTag("es-ES");
            String currentMonth = LocalDate.now().getMonth().getDisplayName(TextStyle.FULL, spanishLocale)
                    .toUpperCase();

            // Add seller rows to summary
            for (Map.Entry<User, List<Sale>> entry : salesBySeller.entrySet()) {
                User seller = entry.getKey();
                List<Sale> sellerSales = entry.getValue();

                BigDecimal totalSubtotal = BigDecimal.ZERO;
                BigDecimal totalShipping = BigDecimal.ZERO;
                BigDecimal totalTotal = BigDecimal.ZERO;
                BigDecimal totalCommission = BigDecimal.ZERO;

                for (Sale s : sellerSales) {
                    BigDecimal sub = s.getSubtotal() != null ? s.getSubtotal() : BigDecimal.ZERO;
                    BigDecimal ship = s.getShipping() != null ? s.getShipping() : BigDecimal.ZERO;
                    BigDecimal tot = s.getTotal() != null ? s.getTotal() : BigDecimal.ZERO;
                    BigDecimal comm = s.getCommissionAmount() != null ? s.getCommissionAmount() : BigDecimal.ZERO;

                    if (s.getSubtotal() == null && s.getTotal() != null) {
                        sub = tot.subtract(ship);
                    }

                    totalSubtotal = totalSubtotal.add(sub);
                    totalShipping = totalShipping.add(ship);
                    totalTotal = totalTotal.add(tot);
                    totalCommission = totalCommission.add(comm);
                }

                Row row = summarySheet.createRow(rowNum++);
                row.createCell(0).setCellValue(seller.getFullName());
                row.createCell(1).setCellValue(currentMonth);

                Cell cellSub = row.createCell(2);
                cellSub.setCellValue(totalSubtotal.doubleValue());
                cellSub.setCellStyle(currencyStyle);

                Cell cellShip = row.createCell(3);
                cellShip.setCellValue(totalShipping.doubleValue());
                cellShip.setCellStyle(currencyStyle);

                Cell cellTot = row.createCell(4);
                cellTot.setCellValue(totalTotal.doubleValue());
                cellTot.setCellStyle(currencyStyle);

                String percentageStr = (seller.getCommissionPercentage() != null ? seller.getCommissionPercentage()
                        : BigDecimal.ZERO) + "%";
                row.createCell(5).setCellValue(percentageStr);

                Cell cellComm = row.createCell(6);
                cellComm.setCellValue(totalCommission.doubleValue());
                cellComm.setCellStyle(currencyStyle);

                grandTotalSubtotal = grandTotalSubtotal.add(totalSubtotal);
                grandTotalShipping = grandTotalShipping.add(totalShipping);
                grandTotalTotal = grandTotalTotal.add(totalTotal);
                grandTotalCommission = grandTotalCommission.add(totalCommission);
            }

            // Add TOTAL row to summary
            addTotalRow(summarySheet, rowNum, currentMonth, grandTotalSubtotal, grandTotalShipping,
                    grandTotalTotal, grandTotalCommission, headerStyle, currencyStyle);

            // Auto-size columns in summary
            for (int i = 0; i < headers.length; i++) {
                summarySheet.autoSizeColumn(i);
            }

            // ========== INDIVIDUAL SELLER SHEETS ==========
            for (Map.Entry<User, List<Sale>> entry : salesBySeller.entrySet()) {
                createSellerSheet(workbook, entry.getKey(), entry.getValue(), headerStyle, currencyStyle,
                        commissionStyle, toReceiveStyle);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Create individual seller sheet with sale details.
     */
    private void createSellerSheet(Workbook workbook, User seller, List<Sale> sellerSales,
            CellStyle headerStyle, CellStyle currencyStyle,
            CellStyle commissionStyle, CellStyle toReceiveStyle) {
        // Create sheet with seller's name (sanitize for Excel sheet name)
        String sheetName = seller.getFullName().replaceAll("[\\\\/:*?\"<>|]", "_");
        if (sheetName.length() > 31) {
            sheetName = sheetName.substring(0, 31);
        }
        Sheet sellerSheet = workbook.createSheet(sheetName);

        // Headers for individual seller sheet
        Row sellerHeaderRow = sellerSheet.createRow(0);
        String[] sellerHeaders = {
                "FECHA", "CLIENTE", "SUBTOTAL", "VALOR DE ENVÍO", "TOTAL",
                "REGISTRO DE PAGO", "NÚMERO DE DOCUMENTO (PAGO)", "NÚMERO DE PEDIDO"
        };

        for (int i = 0; i < sellerHeaders.length; i++) {
            Cell cell = sellerHeaderRow.createCell(i);
            cell.setCellValue(sellerHeaders[i]);
            cell.setCellStyle(headerStyle);
        }

        // Add sales data
        int sellerRowNum = 1;
        BigDecimal sellerSubtotal = BigDecimal.ZERO;
        BigDecimal sellerShipping = BigDecimal.ZERO;
        BigDecimal sellerTotal = BigDecimal.ZERO;

        Locale spanishLocale = Locale.forLanguageTag("es-ES");
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MMM", spanishLocale);

        for (Sale sale : sellerSales) {
            Row saleRow = sellerSheet.createRow(sellerRowNum++);

            // Date
            String dateStr = sale.getOrderDate() != null
                    ? sale.getOrderDate().format(dateFormatter)
                    : "-";
            saleRow.createCell(0).setCellValue(dateStr);

            // Client
            saleRow.createCell(1).setCellValue(sale.getCustomerName() != null ? sale.getCustomerName() : "-");

            // Subtotal
            BigDecimal sub = sale.getSubtotal() != null ? sale.getSubtotal() : BigDecimal.ZERO;
            Cell subCell = saleRow.createCell(2);
            subCell.setCellValue(sub.doubleValue());
            subCell.setCellStyle(currencyStyle);
            sellerSubtotal = sellerSubtotal.add(sub);

            // Shipping
            BigDecimal ship = sale.getShipping() != null ? sale.getShipping() : BigDecimal.ZERO;
            Cell shipCell = saleRow.createCell(3);
            shipCell.setCellValue(ship.doubleValue());
            shipCell.setCellStyle(currencyStyle);
            sellerShipping = sellerShipping.add(ship);

            // Total
            BigDecimal tot = sale.getTotal() != null ? sale.getTotal() : BigDecimal.ZERO;
            Cell totCell = saleRow.createCell(4);
            totCell.setCellValue(tot.doubleValue());
            totCell.setCellStyle(currencyStyle);
            sellerTotal = sellerTotal.add(tot);

            // Payment method and document number
            String paymentMethod = "-";
            String documentNumber = "-";
            if (sale.getPayments() != null && !sale.getPayments().isEmpty()) {
                Payment payment = sale.getPayments().get(sale.getPayments().size() - 1);
                paymentMethod = payment.getPaymentMethod() != null ? payment.getPaymentMethod().toString() : "-";
                documentNumber = payment.getReceiptUrl() != null ? payment.getReceiptUrl() : "-";
            }
            saleRow.createCell(5).setCellValue(paymentMethod);
            saleRow.createCell(6).setCellValue(documentNumber);

            // Order number
            saleRow.createCell(7).setCellValue(sale.getOrderNumber() != null ? sale.getOrderNumber() : "-");
        }

        // Add summary rows at the bottom
        addSellerSummaryRows(sellerSheet, sellerRowNum, seller, sellerSubtotal, sellerShipping,
                sellerTotal, currencyStyle, commissionStyle, toReceiveStyle);

        // Auto-size columns
        for (int i = 0; i < sellerHeaders.length; i++) {
            sellerSheet.autoSizeColumn(i);
        }
    }

    /**
     * Add summary rows to seller sheet (total, commission, adelantos, a favor, a
     * recibir).
     */
    private void addSellerSummaryRows(Sheet sheet, int startRow, User seller,
            BigDecimal subtotal, BigDecimal shipping, BigDecimal total,
            CellStyle currencyStyle, CellStyle commissionStyle, CellStyle toReceiveStyle) {
        // Total en ventas row
        Row totalRow = sheet.createRow(startRow);
        totalRow.createCell(0).setCellValue("total en ventas");

        Cell subTotalCell = totalRow.createCell(2);
        subTotalCell.setCellValue(subtotal.doubleValue());
        subTotalCell.setCellStyle(currencyStyle);

        Cell shipTotalCell = totalRow.createCell(3);
        shipTotalCell.setCellValue(shipping.doubleValue());
        shipTotalCell.setCellStyle(currencyStyle);

        Cell totalTotalCell = totalRow.createCell(4);
        totalTotalCell.setCellValue(total.doubleValue());
        totalTotalCell.setCellStyle(currencyStyle);

        // Commission row
        BigDecimal commissionPercentage = seller.getCommissionPercentage() != null ? seller.getCommissionPercentage()
                : BigDecimal.ZERO;
        BigDecimal commissionAmount = total.multiply(commissionPercentage)
                .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);

        Row commissionRow = sheet.createRow(startRow + 1);
        commissionRow.createCell(0).setCellValue("comision " + commissionPercentage + "%");

        Cell commCell = commissionRow.createCell(2);
        commCell.setCellValue(commissionAmount.doubleValue());
        commCell.setCellStyle(commissionStyle);

        // Adelantos row
        Row adelantosRow = sheet.createRow(startRow + 2);
        adelantosRow.createCell(0).setCellValue("adelantos");

        // A favor row
        Row aFavorRow = sheet.createRow(startRow + 3);
        aFavorRow.createCell(0).setCellValue("a favor");

        // A recibir row
        Row aRecibirRow = sheet.createRow(startRow + 4);
        aRecibirRow.createCell(0).setCellValue("a recibir");

        Cell toReceiveCell = aRecibirRow.createCell(2);
        toReceiveCell.setCellValue(commissionAmount.doubleValue());
        toReceiveCell.setCellStyle(toReceiveStyle);
    }

    /**
     * Add total row to summary sheet.
     */
    private void addTotalRow(Sheet sheet, int rowNum, String month,
            BigDecimal totalSubtotal, BigDecimal totalShipping, BigDecimal totalTotal,
            BigDecimal totalCommission, CellStyle headerStyle, CellStyle currencyStyle) {
        Row totalRow = sheet.createRow(rowNum);

        CellStyle totalStyle = sheet.getWorkbook().createCellStyle();
        totalStyle.cloneStyleFrom(headerStyle);
        totalStyle.setAlignment(HorizontalAlignment.RIGHT);

        Cell labelCell = totalRow.createCell(0);
        labelCell.setCellValue("TOTAL:");
        labelCell.setCellStyle(totalStyle);

        totalRow.createCell(1).setCellValue(month);

        Cell totSub = totalRow.createCell(2);
        totSub.setCellValue(totalSubtotal.doubleValue());
        totSub.setCellStyle(currencyStyle);

        Cell totShip = totalRow.createCell(3);
        totShip.setCellValue(totalShipping.doubleValue());
        totShip.setCellStyle(currencyStyle);

        Cell totTot = totalRow.createCell(4);
        totTot.setCellValue(totalTotal.doubleValue());
        totTot.setCellStyle(currencyStyle);

        totalRow.createCell(5).setCellValue("");

        Cell totComm = totalRow.createCell(6);
        totComm.setCellValue(totalCommission.doubleValue());
        totComm.setCellStyle(currencyStyle);
    }

    /**
     * Create header cell style.
     */
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        return headerStyle;
    }

    /**
     * Create currency cell style.
     */
    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle currencyStyle = workbook.createCellStyle();
        DataFormat format = workbook.createDataFormat();
        currencyStyle.setDataFormat(format.getFormat("$#,##0.00"));
        return currencyStyle;
    }

    /**
     * Create highlighted cell style (for commission and to receive).
     */
    private CellStyle createHighlightStyle(Workbook workbook, CellStyle baseStyle, IndexedColors color) {
        CellStyle highlightStyle = workbook.createCellStyle();
        highlightStyle.cloneStyleFrom(baseStyle);
        highlightStyle.setFillForegroundColor(color.getIndex());
        highlightStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return highlightStyle;
    }
}
