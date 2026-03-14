package com.cdz.payload.dto;

import com.cdz.model.Store;
import jakarta.persistence.Column;
import jakarta.persistence.ManyToOne;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProductDTO {

    private Long id;

    private String name;

    private String sku;

    private String description;

    private Double mrp;

    private Double sellingPrice;
    private Double costPrice;
    private Double discountPercentage;
    private Long brandId;
    private String brandName;
    private Long rackId;
    private String rackName;
    private Long shelfId;
    private String shelfName;
    
    private boolean hasVariants;
    private java.util.List<ProductVariantDTO> variants;
    private String image;

    private CategoryDTO category;

    private Long categoryId;

    private Long storeId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
