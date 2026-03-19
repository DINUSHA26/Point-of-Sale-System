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
public class StoreCreditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    private Customer customer;

    private Double amount; // Positive for issue, negative for redemption
    private String type; // "ISSUE", "REDEMPTION"
    
    // Linked reference IDs
    private Long orderId; 
    private Long refundId;

    private String reason;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
