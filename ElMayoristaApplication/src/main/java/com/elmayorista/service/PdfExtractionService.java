package com.elmayorista.service;

import com.elmayorista.sale.Sale;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PdfExtractionService {

    public Sale extractSaleData(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            String text = extractText(inputStream);
            Sale sale = new Sale();

            // Extract all data from the PDF text
            String customerName = extractField(text, "Nombre:\\s*(.+)");
            String orderNumber = extractField(text, "Pedido No\\.:\\s*(\\S+)");
            String dateString = extractField(text, "Fecha\\s*(\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2})");
            String amountString = extractField(text, "Cantidad:\\s*\\$\\s*([\\d,.]+)");
            String address = extractField(text, "Direccion:\\s*(.+)");
            String idCard = extractField(text, "Cedula:\\s*(\\S+)");
            String city = extractField(text, "Ciudad:\\s*(.+)");
            String phone = extractField(text, "Telefono:\\s*(\\S+)");
            String email = extractField(text, "Correo electronico:\\s*(\\S+)");

            // Set the fields that exist in the Sale entity
            sale.setCustomerName(customerName);
            sale.setOrderNumber(orderNumber);
            sale.setCustomerAddress(address);
            sale.setCustomerIdNumber(idCard);
            sale.setCustomerCity(city);
            sale.setCustomerPhone(phone);
            sale.setCustomerEmail(email);

            // Parse and set the order date
            if (dateString != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                sale.setOrderDate(LocalDateTime.parse(dateString, formatter));
            } else {
                sale.setOrderDate(LocalDateTime.now()); // Fallback to current time
            }

            // Parse and set the total amount
            if (amountString != null) {
                // Convert a string like "374,40" to a BigDecimal-parsable "374.40"
                String parsableAmount = amountString.replace(".", "").replace(',', '.');
                BigDecimal total = new BigDecimal(parsableAmount);
                sale.setTotal(total);
                // Per user request, the "Cantidad" is the total. Set subtotal and shipping accordingly.
                sale.setSubtotal(total);
                sale.setShipping(BigDecimal.ZERO);
            } else {
                // Fallback if amount is not found
                sale.setTotal(BigDecimal.ZERO);
                sale.setSubtotal(BigDecimal.ZERO);
                sale.setShipping(BigDecimal.ZERO);
            }

            return sale;
        } catch (Exception e) {
            throw new RuntimeException("Error extracting sale data from PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Extracts a single field value from text using a regex pattern.
     * @param text The full text to search in.
     * @param regex The regex pattern with one capturing group.
     * @return The captured group value, or null if not found.
     */
    private String extractField(String text, String regex) {
        // Using DOTALL to allow '.' to match newline characters for multi-line fields like address
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    public String extractText(InputStream inputStream) {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            return pdfStripper.getText(document);
        } catch (Exception e) {
            throw new RuntimeException("Error extracting text from PDF", e);
        }
    }
}