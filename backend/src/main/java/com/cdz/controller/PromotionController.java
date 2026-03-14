package com.cdz.controller;

import com.cdz.model.Promotion;
import com.cdz.model.User;
import com.cdz.payload.response.ApiResponse;
import com.cdz.service.PromotionService;
import com.cdz.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/promotions")
@Tag(name = "Promotions", description = "Discount and Promotion management")
public class PromotionController {

    private final PromotionService promotionService;
    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create a new promotion")
    public ResponseEntity<Promotion> createPromotion(@RequestBody Promotion promotion,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserFromJwtToken(jwt);
        // Add null check for user's store before setting it
        if (user.getStore() == null) {
            // Depending on business logic, you might want to throw an exception,
            // return a bad request, or handle it differently.
            // For now, we'll return a bad request indicating the user is not associated with a store.
            return ResponseEntity.badRequest().build();
        }
        promotion.setStore(user.getStore());
        return ResponseEntity.ok(promotionService.createPromotion(promotion));
    }

    @GetMapping
    @Operation(summary = "Get all promotions for the store")
    public ResponseEntity<List<Promotion>> getStorePromotions(@RequestHeader("Authorization") String jwt,
            @RequestParam(required = false) String type) throws Exception {
        User user = userService.getUserFromJwtToken(jwt);
        if (user.getStore() == null) {
            return ResponseEntity.ok(List.of());
        }
        
        if (type != null && !type.equalsIgnoreCase("all")) {
            String typeStr = type.toUpperCase();
            // Handle plural forms from frontend
            if (typeStr.endsWith("S") && !typeStr.equals("SEASONAL")) {
                typeStr = typeStr.substring(0, typeStr.length() - 1);
            }
            if (typeStr.equals("MEMBER")) { // Just to be sure
                // OK
            }
            
            try {
                Promotion.PromotionType promotionType = Promotion.PromotionType.valueOf(typeStr);
                return ResponseEntity.ok(promotionService.getStorePromotionsByType(user.getStore().getId(), promotionType));
            } catch (IllegalArgumentException e) {
                // Return empty list instead of crashing if type is invalid
                return ResponseEntity.ok(List.of());
            }
        }
        return ResponseEntity.ok(promotionService.getStorePromotions(user.getStore().getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a promotion")
    public ResponseEntity<Promotion> updatePromotion(@PathVariable Long id, @RequestBody Promotion promotion) throws Exception {
        return ResponseEntity.ok(promotionService.updatePromotion(id, promotion));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a promotion")
    public ResponseEntity<ApiResponse> deletePromotion(@PathVariable Long id) throws Exception {
        promotionService.deletePromotion(id);
        ApiResponse res = new ApiResponse();
        res.setMessage("Promotion deleted successfully");
        return ResponseEntity.ok(res);
    }

    @GetMapping("/validate-coupon")
    @Operation(summary = "Validate a coupon code")
    public ResponseEntity<Promotion> validateCoupon(@RequestParam String code) throws Exception {
        return ResponseEntity.ok(promotionService.validateCoupon(code));
    }
}
