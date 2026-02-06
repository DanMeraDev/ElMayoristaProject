package com.elmayorista.service;

import com.elmayorista.dto.ProductDTO;
import com.elmayorista.dto.SaleReportDTO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PdfParsingService {

    public SaleReportDTO parsePdfText(String text) {
        String orderNumber = extractField(text, "Pedido No\\.:\\s*(\\S+)");
        List<ProductDTO> productList = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");
        boolean inProductBlock = false;

        for (int i = 0; i < lines.length; i++) {
            String currentLine = lines[i].trim();

            if (currentLine.contains("CANT.") && currentLine.contains("IMAGEN") && currentLine.contains("DETALLE")) {
                inProductBlock = true;
                continue;
            }

            if (currentLine.matches("Total:\\s*\\$\\s*[\\d.,]+")) {
                inProductBlock = false;
                break;
            }

            if (inProductBlock && currentLine.startsWith("SKU:")) {
                String sku = currentLine.substring(5).trim();
                
                // Try Complex Format (from PDF file analysis) first
                try {
                    String priceLine = lines[i - 2].trim();
                    String name = lines[i - 3].trim();
                    String quantityLine = lines[i - 4].trim();

                    Pattern pricePattern = Pattern.compile("([\\d.,]+)\\s+\\$([\\d.,]+)");
                    Matcher priceMatcher = pricePattern.matcher(priceLine);

                    Pattern quantityPattern = Pattern.compile("^[\\d,]+");
                    Matcher quantityMatcher = quantityPattern.matcher(quantityLine);

                    if (priceMatcher.find() && quantityMatcher.find()) {
                        BigDecimal unitPrice = parseLatinNumber(priceMatcher.group(1));
                        BigDecimal subtotal = parseLatinNumber(priceMatcher.group(2));
                        BigDecimal quantity = parseLatinNumber(quantityMatcher.group(0));

                        if (!name.matches("[\\d,.]+") && !name.equalsIgnoreCase("Unidades")) {
                             productList.add(new ProductDTO(sku, name, quantity, unitPrice, subtotal));
                             continue; // Success, go to next iteration
                        }
                    }
                } catch (Exception e) {
                    // If Complex Format fails, do nothing and let it fall through to the next try block.
                }

                // Try Simpler Format (from user's text sample)
                try {
                    String name = lines[i - 1].trim();
                    String quantityLine = lines[i - 2].trim();
                    String priceLine = lines[i + 1].trim();

                    Pattern pricePattern = Pattern.compile("([\\d,]+)\\s+\\$ ([\\d,]+)");
                    Matcher priceMatcher = pricePattern.matcher(priceLine);

                    Pattern quantityPattern = Pattern.compile("^([\\d,]+)");
                    Matcher quantityMatcher = quantityPattern.matcher(quantityLine);

                     if (priceMatcher.find() && quantityMatcher.find()) {
                        BigDecimal unitPrice = parseLatinNumber(priceMatcher.group(1));
                        BigDecimal subtotal = parseLatinNumber(priceMatcher.group(2));
                        BigDecimal quantity = parseLatinNumber(quantityMatcher.group(0));

                        if (!name.matches("[\\d,.]+") && !name.equalsIgnoreCase("Unidades")) {
                             productList.add(new ProductDTO(sku, name, quantity, unitPrice, subtotal));
                        }
                    }
                } catch (Exception e) {
                    // Both formats failed for this SKU line. Log or ignore.
                    // System.err.println("Could not parse product with SKU: " + sku);
                }
            }
        }

        BigDecimal total = BigDecimal.ZERO;
        Pattern totalPattern = Pattern.compile("Total:\\s*\\$\\s*([\\d.,]+)");
        Matcher totalMatcher = totalPattern.matcher(text);
        if (totalMatcher.find()) {
            total = parseLatinNumber(totalMatcher.group(1));
        }

        String customerName = extractField(text, "Nombre:\\s*(.+)");

        return new SaleReportDTO(total, total, orderNumber, productList, customerName);
    }
    private String extractField(String text, String regex) {
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    public BigDecimal parseLatinNumber(String value) {
        if (value == null) return BigDecimal.ZERO;
        // Remover símbolo $ y espacios
        String cleaned = value.replace("$", "").trim();
        // Reemplazar punto de miles por nada, y coma decimal por punto
        cleaned = cleaned.replace(".", "").replace(",", ".");
        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            System.err.println("Error parsing number: " + value);
            return BigDecimal.ZERO;
        }
    }
}
