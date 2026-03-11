package com.cdz.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    private Store store;

    @ManyToOne
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = true)
    private Integer lowStockThreshold = 10; // Default threshold of 10 units

    private LocalDateTime lastUpdate;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdate = LocalDateTime.now();
    }

    // Check if inventory is below threshold
    public boolean isLowStock() {
        return quantity != null && lowStockThreshold != null &&
                quantity <= lowStockThreshold;
    }

}
