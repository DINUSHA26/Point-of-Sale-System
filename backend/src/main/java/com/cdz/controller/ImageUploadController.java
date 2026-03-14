package com.cdz.controller;

import com.cdz.service.ImageUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/images")
@Tag(name = "Images", description = "Image upload operations")
public class ImageUploadController {

    private final ImageUploadService imageUploadService;

    @PostMapping("/upload")
    @Operation(summary = "Upload an image", description = "Upload an image file and get back the URL")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String url = imageUploadService.uploadImage(file);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
