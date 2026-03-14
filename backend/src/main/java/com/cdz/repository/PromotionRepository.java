package com.cdz.repository;

import com.cdz.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByStoreId(Long storeId);
    List<Promotion> findByStoreIdAndType(Long storeId, Promotion.PromotionType type);
    Promotion findByCouponCodeAndActiveTrue(String couponCode);
}
