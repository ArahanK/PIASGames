package com.eecs4413final.demo.service;

import com.eecs4413final.demo.dto.ProductDTO;
import com.eecs4413final.demo.exception.ProductNotFoundException;
import com.eecs4413final.demo.model.Categories;
import com.eecs4413final.demo.model.Product;
import com.eecs4413final.demo.repository.CategoriesRepository;
import com.eecs4413final.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoriesRepository categoriesRepository;

    @Autowired
    public ProductServiceImpl(ProductRepository productRepository, CategoriesRepository categoriesRepository) {
        this.productRepository = productRepository;
        this.categoriesRepository = categoriesRepository;
    }

    @Override
    public Product addProduct(ProductDTO productDTO) {
        Set<Categories> prodCategories = productDTO.getCategory();

        Set<Categories> repoCategories = new HashSet<>(categoriesRepository.findAll());

        // Check if category for product exists in repo, if not add
        for (Categories categories : prodCategories) {
            if (!repoCategories.contains(categories)) {
                categoriesRepository.save(categories);
            }
        }

        Product product = new Product(productDTO.getName(), productDTO.getDeveloper(), productDTO.getDescription(),
                productDTO.getPrice(), productDTO.getStock(), productDTO.getSaleMod(), prodCategories, productDTO.getPlatform());

        return productRepository.save(product);
    }

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public List<Product> getByCategory(String category) {
        return productRepository.findByCategoryList_Name(category);
    }

    @Override
    public List<Product> getByPlatform(String platform) {
        return productRepository.findByPlatform(platform);
    }

    @Override
    public List<Product> getByDeveloper(String developer) {
        return productRepository.findByDeveloper(developer);
    }

    @Override
    public List<Product> getByDeveloperAndPlatform(String developer, String platform) {
        return productRepository.findByDeveloperAndPlatform(developer, platform);
    }

    @Override
    public List<Product> getByCategoryAndPlatform(String category, String platform) {
        return productRepository.findByCategoryList_NameAndPlatform(category, platform);
    }

    @Override
    public Product getByName(String name) {
        return productRepository.findByName(name);
    }

    @Override
    public List<Product> getByPlatformAndName(String platform, String name) {
        return productRepository.findByPlatformAndName(platform, name);
    }

    @Override
    public List<Product> getByCategoryListIn(Set<Categories> categories) {
        return productRepository.findByCategoryListIn(categories);
    }

    @Override
    public Product getById(Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product != null) {
            return product;
        } else {
            throw new ProductNotFoundException("Product not found with id: " + productId);
        }
    }

    @Override
    public void deleteById(Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product != null) {
            productRepository.deleteById(productId);
        } else {
            throw new ProductNotFoundException("Product not found with id: " + productId);
        }
    }
}
