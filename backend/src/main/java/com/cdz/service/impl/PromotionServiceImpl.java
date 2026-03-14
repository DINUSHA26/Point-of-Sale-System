package com.cdz.service.impl;

import com.cdz.model.Promotion;
import com.cdz.repository.PromotionRepository;
import com.cdz.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;

    @Override
    public Promotion createPromotion(Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    @Override
    public Promotion updatePromotion(Long id, Promotion details) throws Exception {
        Promotion existing = promotionRepository.findById(id)
                .orElseThrow(() -> new Exception("Promotion not found"));
        
        existing.setName(details.getName());
        existing.setDescription(details.getDescription());
        existing.setDiscountValue(details.getDiscountValue());
        existing.setDiscountUnit(details.getDiscountUnit());
        existing.setStartDate(details.getStartDate());
        existing.setEndDate(details.getEndDate());
        existing.setActive(details.getActive());
        existing.setBuyQuantity(details.getBuyQuantity());
        existing.setGetQuantity(details.getGetQuantity());
        existing.setMinPurchaseAmount(details.getMinPurchaseAmount());
        
        return promotionRepository.save(existing);
    }

    @Override
    public void deletePromotion(Long id) throws Exception {
        promotionRepository.deleteById(id);
    }

    @Override
    public Promotion getPromotion(Long id) throws Exception {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new Exception("Promotion not found"));
    }

    @Override
    public List<Promotion> getStorePromotions(Long storeId) {
        return promotionRepository.findByStoreId(storeId);
    }

    @Override
    public List<Promotion> getStorePromotionsByType(Long storeId, Promotion.PromotionType type) {
        return promotionRepository.findByStoreIdAndType(storeId, type);
    }

    @Override
    public Promotion validateCoupon(String code) throws Exception {
        Promotion promotion = promotionRepository.findByCouponCodeAndActiveTrue(code);
        if (promotion == null) {
            throw new Exception("Invalid or inactive coupon code");
        }
        
        LocalDateTime now = LocalDateTime.now();
        if (promotion.getStartDate() != null && promotion.getStartDate().isAfter(now)) {
            throw new Exception("Coupon is not yet active");
        }
        if (promotion.getEndDate() != null && promotion.getEndDate().isBefore(now)) {
            throw new Exception("Coupon has expired");
        }
        
        return promotion;
    }
}
