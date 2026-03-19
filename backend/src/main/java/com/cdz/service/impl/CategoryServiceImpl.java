package com.cdz.service.impl;

import com.cdz.domain.UserRole;
import com.cdz.exceptions.UserException;
import com.cdz.mapper.CategoryMapper;
import com.cdz.model.Category;
import com.cdz.model.Store;
import com.cdz.model.User;
import com.cdz.payload.dto.CategoryDTO;
import com.cdz.model.Product;
import com.cdz.repository.CategoryRepository;
import com.cdz.repository.ProductRepository;
import com.cdz.repository.StoreRepository;
import com.cdz.service.CategoryService;
import com.cdz.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final UserService userService;



    @Override
    @org.springframework.transaction.annotation.Transactional
    public CategoryDTO createCategory(CategoryDTO dto) throws Exception {

        User user = userService.getCurrentUser();
        Store store = storeRepository.findById(dto.getStoreId()).orElseThrow(
                () -> new Exception("Store not found")
        );
        Category parentCategory = null;
        if (dto.getParentCategoryId() != null) {
            parentCategory = categoryRepository.findById(dto.getParentCategoryId()).orElseThrow(
                    () -> new Exception("Parent category not found")
            );
        }

        Category category = Category.builder()
                .store(store)
                .name(dto.getName())
                .parent(parentCategory)
                .build();

        checkAuthority(user, category.getStore());

        return CategoryMapper.toDTO(categoryRepository.save(category));
    }

    @Override
    public List<CategoryDTO> getCategoriesByStore(Long storeId) {
        List<Category> categories = categoryRepository.findByStoreId(storeId);
        return categories.stream()
                .map(
                        CategoryMapper::toDTO
                ).collect(Collectors.toList());

    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO dto) throws Exception {
        Category category = categoryRepository.findById(id).orElseThrow(
                ()-> new Exception("category not found")
        );
        User user = userService.getCurrentUser();
        category.setName(dto.getName());

        if (dto.getParentCategoryId() != null) {
            if (dto.getParentCategoryId().equals(id)) {
                throw new Exception("A category cannot be its own parent");
            }
            Category parentCategory = categoryRepository.findById(dto.getParentCategoryId()).orElseThrow(
                    () -> new Exception("Parent category not found")
            );
            category.setParent(parentCategory);
        } else {
            category.setParent(null);
        }

        checkAuthority(user, category.getStore());

        return CategoryMapper.toDTO(categoryRepository.save(category));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteCategory(Long id) throws Exception {
        Category category = categoryRepository.findById(id).orElseThrow(
                () -> new Exception("category not found")
        );
        User user = userService.getCurrentUser();

        checkAuthority(user, category.getStore());

        // Check if there are products in this category or its sub-categories
        if (hasProductsInSubtree(category)) {
            throw new Exception("Cannot delete category because it or its sub-categories still contain products. Please reassign or delete the products first.");
        }

        categoryRepository.delete(category);
    }

    private boolean hasProductsInSubtree(Category category) {
        // Check current category
        List<Product> products = productRepository.findByCategoryId(category.getId());
        if (!products.isEmpty()) {
            return true;
        }

        // Check sub-categories
        if (category.getChildren() != null) {
            for (Category child : category.getChildren()) {
                if (hasProductsInSubtree(child)) {
                    return true;
                }
            }
        }
        return false;
    }

    private void checkAuthority(User user, Store store) throws Exception {
        boolean isOwner = user.getRole() == UserRole.ROLE_OWNER;
        boolean isSameStore = user.getStore() != null && user.getStore().getId() == store.getId();
        
        if (!isOwner && !isSameStore) {
            throw new Exception("You don't have permission to manage this category");
        }
    }

}
