package com.cdz.model;

import com.cdz.domain.ReturnStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private Integer quantity;

    @Builder.Default
    private Integer returnedQuantity = 0;

    private Double price; // Final price after discount
    private Double costPrice; // Cost of product at time of sale
    private Double originalPrice; // Price before discount
    private Double discountApplied = 0.0; // Actual discount amount applied
    private String productName; // Keep track of product name even if product gets deleted
    private String productSku; // Keep track of product sku even if product gets deleted

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReturnStatus returnStatus = ReturnStatus.NOT_RETURNED;

    private Long linkedOrderId; // ID of the exchange order or refund reference

    @ManyToOne
    private Product product;

    @ManyToOne
    private Order order;
}
