package com.cdz.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.ArrayList;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductAttribute {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    @ManyToOne
    private Store store;

    @ElementCollection
    @CollectionTable(name = "product_attribute_values", joinColumns = @JoinColumn(name = "attribute_id"))
    @Column(name = "value")
    @Builder.Default
    private List<String> values = new ArrayList<>();
}
