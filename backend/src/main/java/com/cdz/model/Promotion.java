package com.cdz.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;
    private String description;

    @Enumerated(EnumType.STRING)
    private PromotionType type; // SEASONAL, COUPON, BOGO, MEMBER

    private Double discountValue;

    @Enumerated(EnumType.STRING)
    private DiscountUnit discountUnit; // PERCENTAGE, FIXED

    private String couponCode;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private Boolean active = true;

    @ManyToOne
    private Store store;

    // For BOGO
    private Integer buyQuantity;
    private Integer getQuantity;

    private Double minPurchaseAmount;

    private Long categoryId;
    private Long productId;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum PromotionType {
        SEASONAL, COUPON, BOGO, MEMBER
    }

    public enum DiscountUnit {
        PERCENTAGE, FIXED
    }
}
