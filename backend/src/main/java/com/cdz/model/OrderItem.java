package com.cdz.model;

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

    private Double price; // Final price after discount
    private Double costPrice; // Cost of product at time of sale
    private Double originalPrice; // Price before discount
    private Double discountApplied = 0.0; // Actual discount amount applied
    private String productName; // Keep track of product name even if product gets deleted
    private String productSku; // Keep track of product sku even if product gets deleted

    @ManyToOne
    private Product product;

    @ManyToOne
    private Order order;
}
