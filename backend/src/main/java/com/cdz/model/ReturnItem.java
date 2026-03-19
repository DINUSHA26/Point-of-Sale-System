package com.cdz.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    @JsonIgnore
    private Refund refund;

    @ManyToOne
    private OrderItem originalOrderItem;

    private Integer quantity;

    @Enumerated(EnumType.STRING)
    private ReturnCondition itemCondition;

    private Double refundAmount;

    public enum ReturnCondition {
        GOOD, DAMAGED
    }
}
