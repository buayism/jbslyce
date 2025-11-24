package com.barbercut.auth.service;

import com.barbercut.admin.model.Barber;
import com.barbercut.admin.repository.BarberRepository;
import com.barbercut.auth.dto.AuthResponse;
import com.barbercut.auth.dto.LoginRequest;
import com.barbercut.auth.dto.RegisterRequest;
import com.barbercut.auth.model.User;
import com.barbercut.auth.model.UserRole;
import com.barbercut.auth.repository.UserRepository;
import com.barbercut.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BarberRepository barberRepository;

    @Autowired
    private NotificationService notificationService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthResponse register(RegisterRequest request) {
        // Validate
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Default role to CLIENT if not specified
        UserRole role = request.getRole() != null ? request.getRole() : UserRole.CLIENT;

        // Hash password
        String passwordHash = passwordEncoder.encode(request.getPassword());

        // Create user
        User user = new User(
                request.getEmail(),
                request.getUsername(),
                passwordHash,
                role,
                role == UserRole.BARBER ? (request.getBarberId() != null ? request.getBarberId() : request.getUsername()) : null
        );

        user = userRepository.save(user);

        // If role is BARBER, ensure a corresponding Barber record exists with pending status
        if (user.getRole() == UserRole.BARBER && user.getBarberId() != null) {
            boolean exists = barberRepository.existsById(user.getBarberId());
            if (!exists) {
                String displayName = capitalize(user.getUsername());
                Barber barber = new Barber(user.getBarberId(), displayName, user.getEmail(), null, user.getAvatarUrl(), user.getBio(), "pending");
                barberRepository.save(barber);
            }
        }

        // Publish notification: new user signup (after save)
        try {
            java.util.Map<String, Object> meta = new java.util.HashMap<>();
            meta.put("userId", user.getId());
            meta.put("role", user.getRole() != null ? user.getRole().name() : null);
            notificationService.publish(
                "USER_SIGNUP",
                "New user signup",
                (user.getRole() == UserRole.BARBER ? "Barber " : "User ") + user.getUsername() + " signed up.",
                user.getId(),
                user.getId(),
                meta
            );
        } catch (Exception ignored) {}

        return new AuthResponse(user.getId(), user.getEmail(), user.getUsername(), user.getRole(), user.getBarberId());
    }

    public AuthResponse login(LoginRequest request) {
        Optional<User> optionalUser = userRepository.findByUsername(request.getUsername());

        if (!optionalUser.isPresent()) {
            throw new RuntimeException("Invalid username or password");
        }

        User user = optionalUser.get();

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid username or password");
        }

        // Check if user is banned
        if ("banned".equals(user.getStatus())) {
            throw new RuntimeException("Your account has been banned. Please contact support.");
        }

        // Optional role validation
        if (request.getRole() != null && user.getRole() != request.getRole()) {
            throw new RuntimeException("Invalid role for this account");
        }

        // Check if BARBER is approved before allowing login
        if (user.getRole() == UserRole.BARBER && user.getBarberId() != null) {
            Optional<Barber> barberOpt = barberRepository.findById(user.getBarberId());
            if (barberOpt.isPresent()) {
                Barber barber = barberOpt.get();
                if (!"approved".equals(barber.getStatus())) {
                    throw new RuntimeException("Your account is awaiting admin approval. Please try again later.");
                }
            } else {
                throw new RuntimeException("Barber profile not found. Please contact support.");
            }
        }

        AuthResponse out = new AuthResponse(user.getId(), user.getEmail(), user.getUsername(), user.getRole(), user.getBarberId());
        out.setMessage("Login successful");
        out.setToken("mock-" + user.getUsername());
        return out;
    }

    // Utility
    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0,1).toUpperCase() + s.substring(1);
    }
}