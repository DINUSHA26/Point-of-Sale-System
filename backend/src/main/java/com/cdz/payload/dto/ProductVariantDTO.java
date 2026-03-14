package com.cdz.payload.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class ProductVariantDTO {
    private Long id;
    private Long productId;
    private String sku;
    private Double sellingPrice;
    private Double mrp;
    private Map<String, String> attributeValues;
}
