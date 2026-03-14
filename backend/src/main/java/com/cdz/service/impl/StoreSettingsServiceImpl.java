package com.cdz.service.impl;

import com.cdz.model.*;
import com.cdz.repository.*;
import com.cdz.service.StoreSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreSettingsServiceImpl implements StoreSettingsService {

    private final BrandRepository brandRepository;
    private final RackRepository rackRepository;
    private final ShelfRepository shelfRepository;
    private final ProductAttributeRepository attributeRepository;
    private final StoreRepository storeRepository;

    private Store getStore(Long storeId) {
        return storeRepository.findById(storeId)
            .orElseThrow(() -> new EntityNotFoundException("Store not found"));
    }

    @Override
    public Brand createBrand(Long storeId, String name) {
        Brand brand = Brand.builder().name(name).store(getStore(storeId)).build();
        return brandRepository.save(brand);
    }
    @Override
    public List<Brand> getBrandsByStore(Long storeId) {
        return brandRepository.findByStoreId(storeId);
    }
    @Override
    public void deleteBrand(Long id) {
        brandRepository.deleteById(id);
    }

    @Override
    public Rack createRack(Long storeId, String name) {
        Rack rack = Rack.builder().name(name).store(getStore(storeId)).build();
        return rackRepository.save(rack);
    }
    @Override
    public List<Rack> getRacksByStore(Long storeId) {
        return rackRepository.findByStoreId(storeId);
    }
    @Override
    public void deleteRack(Long id) {
        rackRepository.deleteById(id);
    }

    @Override
    public Shelf createShelf(Long storeId, String name) {
        Shelf shelf = Shelf.builder().name(name).store(getStore(storeId)).build();
        return shelfRepository.save(shelf);
    }
    @Override
    public List<Shelf> getShelvesByStore(Long storeId) {
        return shelfRepository.findByStoreId(storeId);
    }
    @Override
    public void deleteShelf(Long id) {
        shelfRepository.deleteById(id);
    }

    @Override
    public ProductAttribute createAttribute(Long storeId, String name, List<String> values) {
        ProductAttribute attr = ProductAttribute.builder()
            .name(name)
            .store(getStore(storeId))
            .values(values)
            .build();
        return attributeRepository.save(attr);
    }
    @Override
    public ProductAttribute updateAttribute(Long id, List<String> values) {
        ProductAttribute attr = attributeRepository.findById(id).orElseThrow();
        attr.setValues(values);
        return attributeRepository.save(attr);
    }
    @Override
    public List<ProductAttribute> getAttributesByStore(Long storeId) {
        return attributeRepository.findByStoreId(storeId);
    }
    @Override
    public void deleteAttribute(Long id) {
        attributeRepository.deleteById(id);
    }
}
