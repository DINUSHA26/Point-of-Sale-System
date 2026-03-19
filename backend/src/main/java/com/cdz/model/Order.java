package com.cdz.model;

import com.cdz.domain.PaymentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Builder
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private Double totalAmount;
    private Double subtotal; // Sum of all items before discount
    private Double totalDiscount = 0.0; // Total discount amount applied

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne
    private Store store;

    @ManyToOne
    private User cashier;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> items;

    @ManyToOne
    private Customer customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderPayment> payments;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private PaymentType paymentType;

    /** Stripe PaymentIntent id when paymentType is CARD (for refunds). */
    private String stripePaymentIntentId;

    private Long parentOrderId; // ID of the original order if this is an exchange/return bill

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
