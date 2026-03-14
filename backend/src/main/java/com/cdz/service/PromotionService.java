package com.cdz.service;

import com.cdz.model.Promotion;
import java.util.List;

public interface PromotionService {
    Promotion createPromotion(Promotion promotion);
    Promotion updatePromotion(Long id, Promotion promotionDetails) throws Exception;
    void deletePromotion(Long id) throws Exception;
    Promotion getPromotion(Long id) throws Exception;
    List<Promotion> getStorePromotions(Long storeId);
    List<Promotion> getStorePromotionsByType(Long storeId, Promotion.PromotionType type);
    Promotion validateCoupon(String code) throws Exception;
}
