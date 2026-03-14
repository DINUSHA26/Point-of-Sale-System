package com.cdz.service.impl;

import com.cdz.configuration.JwtProvider;
import com.cdz.exceptions.UserException;
import com.cdz.model.User;
import com.cdz.repository.UserRepository;
import com.cdz.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final com.cdz.service.ImageUploadService imageUploadService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public User getUserFromJwtToken(String token) throws UserException {

        String email = jwtProvider.getEmailFromToken(token);
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserException("Invalid Token");
        }
        return user;
    }

    @Override
    public User getCurrentUser() throws UserException {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserException("User Not Found");
        }
        return user;
    }

    @Override
    public User getUserByEmail(String email) throws UserException {

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserException("User Not Found");
        }
        return user;
    }

    @Override
    public User getUserById(Long id) throws Exception {

        return userRepository.findById(id).orElseThrow(
                () -> new Exception("User not found"));
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User updateUserProfile(User user, String fullName, String phone, String password,
            org.springframework.web.multipart.MultipartFile imageFile) throws java.io.IOException {
        if (fullName != null && !fullName.isEmpty()) {
            user.setFullName(fullName);
        }
        if (phone != null && !phone.isEmpty()) {
            user.setPhone(phone);
        }

        if (password != null && !password.isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            String fileUrl = imageUploadService.uploadImage(imageFile);
            user.setProfileImage(fileUrl);
        }

        return userRepository.save(user);
    }

    @Override
    public void updateUserStore(User user, com.cdz.model.Store store) {
        user.setStore(store);
        userRepository.save(user);
    }
}
