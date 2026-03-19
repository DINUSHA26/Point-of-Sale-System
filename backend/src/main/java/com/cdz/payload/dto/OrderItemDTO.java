package com.cdz.payload.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderItemDTO {

    private Long id;

    private Integer quantity;

    private Double price;
    private Double originalPrice;
    private Double discountApplied;

    private ProductDTO product;

    private Long productId;

    private String productName;
    private String productSku;

    private Long orderId;
    private String returnStatus;
    private Long linkedOrderId;

}
