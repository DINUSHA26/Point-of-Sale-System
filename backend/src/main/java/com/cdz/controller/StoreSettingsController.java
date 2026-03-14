package com.cdz.controller;

import com.cdz.model.*;
import com.cdz.service.StoreSettingsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/store-settings")
@Tag(name = "Store Settings", description = "Manage brands, racks, shelves, and attributes")
public class StoreSettingsController {

    private final StoreSettingsService service;

    // Brands
    @GetMapping("/{storeId}/brands")
    public ResponseEntity<List<Brand>> getBrands(@PathVariable Long storeId) {
        return ResponseEntity.ok(service.getBrandsByStore(storeId));
    }
    @PostMapping("/{storeId}/brands")
    public ResponseEntity<Brand> createBrand(@PathVariable Long storeId, @RequestParam String name) {
        return ResponseEntity.ok(service.createBrand(storeId, name));
    }
    @DeleteMapping("/brands/{id}")
    public ResponseEntity<Void> deleteBrand(@PathVariable Long id) {
        service.deleteBrand(id);
        return ResponseEntity.ok().build();
    }

    // Racks
    @GetMapping("/{storeId}/racks")
    public ResponseEntity<List<Rack>> getRacks(@PathVariable Long storeId) {
        return ResponseEntity.ok(service.getRacksByStore(storeId));
    }
    @PostMapping("/{storeId}/racks")
    public ResponseEntity<Rack> createRack(@PathVariable Long storeId, @RequestParam String name) {
        return ResponseEntity.ok(service.createRack(storeId, name));
    }
    @DeleteMapping("/racks/{id}")
    public ResponseEntity<Void> deleteRack(@PathVariable Long id) {
        service.deleteRack(id);
        return ResponseEntity.ok().build();
    }

    // Shelves
    @GetMapping("/{storeId}/shelves")
    public ResponseEntity<List<Shelf>> getShelves(@PathVariable Long storeId) {
        return ResponseEntity.ok(service.getShelvesByStore(storeId));
    }
    @PostMapping("/{storeId}/shelves")
    public ResponseEntity<Shelf> createShelf(@PathVariable Long storeId, @RequestParam String name) {
        return ResponseEntity.ok(service.createShelf(storeId, name));
    }
    @DeleteMapping("/shelves/{id}")
    public ResponseEntity<Void> deleteShelf(@PathVariable Long id) {
        service.deleteShelf(id);
        return ResponseEntity.ok().build();
    }

    // Attributes
    @GetMapping("/{storeId}/attributes")
    public ResponseEntity<List<ProductAttribute>> getAttributes(@PathVariable Long storeId) {
        return ResponseEntity.ok(service.getAttributesByStore(storeId));
    }
    @PostMapping("/{storeId}/attributes")
    public ResponseEntity<ProductAttribute> createAttribute(@PathVariable Long storeId, @RequestParam String name, @RequestParam List<String> values) {
        return ResponseEntity.ok(service.createAttribute(storeId, name, values));
    }
    @PutMapping("/attributes/{id}")
    public ResponseEntity<ProductAttribute> updateAttribute(@PathVariable Long id, @RequestParam List<String> values) {
        return ResponseEntity.ok(service.updateAttribute(id, values));
    }
    @DeleteMapping("/attributes/{id}")
    public ResponseEntity<Void> deleteAttribute(@PathVariable Long id) {
        service.deleteAttribute(id);
        return ResponseEntity.ok().build();
    }
}
