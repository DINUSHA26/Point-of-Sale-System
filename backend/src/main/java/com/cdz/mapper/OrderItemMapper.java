package com.cdz.mapper;

import com.cdz.model.OrderItem;
import com.cdz.payload.dto.OrderItemDTO;

public class OrderItemMapper {

    public static OrderItemDTO toDTO(OrderItem item) {

        if (item == null) {
            return null;
        }
        com.cdz.payload.dto.ProductDTO productDTO = null;
        if (item.getProduct() != null) {
            productDTO = ProductMapper.toDTO(item.getProduct());
        } else {
            productDTO = com.cdz.payload.dto.ProductDTO.builder()
                .name(item.getProductName() != null ? item.getProductName() : "Deleted Product")
                .sku(item.getProductSku() != null ? item.getProductSku() : "")
                .sellingPrice(item.getOriginalPrice() != null && item.getQuantity() != null && item.getQuantity() > 0 ? item.getOriginalPrice() / item.getQuantity() : 0.0)
                .build();
        }

        return OrderItemDTO.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .originalPrice(item.getOriginalPrice())
                .discountApplied(item.getDiscountApplied())
                .productName(item.getProductName() != null ? item.getProductName() : (item.getProduct() != null ? item.getProduct().getName() : "Unknown Product"))
                .productSku(item.getProductSku() != null ? item.getProductSku() : (item.getProduct() != null ? item.getProduct().getSku() : ""))
                .product(productDTO)
                .returnStatus(item.getReturnStatus() != null ? item.getReturnStatus().name() : null)
                .linkedOrderId(item.getLinkedOrderId())
                .build();
    }
}
