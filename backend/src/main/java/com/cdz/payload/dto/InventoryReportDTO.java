package com.cdz.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReportDTO {
    private Long productId;
    private String productName;
    private String sku;
    private Integer currentStock;
    private Integer lowStockThreshold;
    private Boolean isLowStock;
    private Integer stockSold;
    private Integer stockAdded;
}
