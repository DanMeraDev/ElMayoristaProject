package com.elmayorista.sale;

import java.math.BigDecimal;
import java.util.List;

public class SaleReportDTO {
    private BigDecimal total;
    private BigDecimal subtotal;
    private String orderNumber;
    private List<ProductDTO> products;
    private String customerName;

    public SaleReportDTO(BigDecimal total, BigDecimal subtotal, String orderNumber, List<ProductDTO> products, String customerName) {
        this.total = total;
        this.subtotal = subtotal;
        this.orderNumber = orderNumber;
        this.products = products;
        this.customerName = customerName;
    }

    // Getters and setters
    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public List<ProductDTO> getProducts() {
        return products;
    }

    public void setProducts(List<ProductDTO> products) {
        this.products = products;
    }
}
