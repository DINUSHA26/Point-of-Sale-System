package com.cdz.model;

import com.cdz.domain.StoreStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String sku;
    // Stock Keeping Unit
    private String description;

    private Double mrp;

    private Double sellingPrice;
    private Double costPrice;

    @Column(nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double discountPercentage = 0.0; // 0-100 percentage discount on selling price

    @ManyToOne
    private Brand brand;

    @ManyToOne
    private Rack rack;

    @ManyToOne
    private Shelf shelf;

    private boolean hasVariants = false;

    private String image;

    @ManyToOne
    private Category category;

    @ManyToOne
    private Store store;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
