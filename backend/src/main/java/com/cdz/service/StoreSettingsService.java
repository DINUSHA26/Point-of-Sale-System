package com.cdz.service;

import com.cdz.model.*;
import java.util.List;

public interface StoreSettingsService {
    // Brand
    Brand createBrand(Long storeId, String name);
    List<Brand> getBrandsByStore(Long storeId);
    void deleteBrand(Long id);

    // Rack
    Rack createRack(Long storeId, String name);
    List<Rack> getRacksByStore(Long storeId);
    void deleteRack(Long id);

    // Shelf
    Shelf createShelf(Long storeId, String name);
    List<Shelf> getShelvesByStore(Long storeId);
    void deleteShelf(Long id);

    // ProductAttribute
    ProductAttribute createAttribute(Long storeId, String name, List<String> values);
    ProductAttribute updateAttribute(Long id, List<String> values);
    List<ProductAttribute> getAttributesByStore(Long storeId);
    void deleteAttribute(Long id);
}
