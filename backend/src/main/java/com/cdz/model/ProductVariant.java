package com.cdz.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashMap;
import java.util.Map;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    private String sku;

    private Double sellingPrice;
    private Double mrp;

    @ElementCollection
    @CollectionTable(name = "variant_attributes", joinColumns = @JoinColumn(name = "variant_id"))
    @MapKeyColumn(name = "attribute_name")
    @Column(name = "attribute_value")
    @Builder.Default
    private Map<String, String> attributeValues = new HashMap<>();
}
