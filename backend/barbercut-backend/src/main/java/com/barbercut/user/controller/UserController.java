package com.barbercut.user.controller;

import com.barbercut.auth.model.User;
import com.barbercut.auth.model.UserRole;
import com.barbercut.auth.repository.UserRepository;
import com.barbercut.rating.model.Rating;
import com.barbercut.rating.repository.RatingRepository;
import com.barbercut.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/barbers")
    public ResponseEntity<List<BarberView>> getBarbers() {
        List<User> barbers = userRepository.findByRole(UserRole.BARBER);
        List<BarberView> out = new ArrayList<>();
        for (User u : barbers) {
            BarberView v = new BarberView();
            v.id = u.getBarberId() != null ? u.getBarberId() : u.getUsername();
            v.username = u.getUsername();
            v.name = capitalize(u.getUsername());
            v.bio = u.getBio();
            v.avatarUrl = u.getAvatarUrl();
            v.createdAt = u.getCreatedAt();
            try {
                java.util.List<Rating> list = ratingRepository.findByBarberId(v.id);
                java.util.DoubleSummaryStatistics stats = list.stream().mapToDouble(Rating::getRating).summaryStatistics();
                v.ratingCount = stats.getCount();
                v.ratingAverage = stats.getCount() == 0 ? 0.0 : Math.round(stats.getAverage() * 10.0) / 10.0;
            } catch (Exception ignored) {
                v.ratingAverage = 0.0;
                v.ratingCount = 0L;
            }
            out.add(v);
        }
        return new ResponseEntity<>(out, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        Optional<User> byId = userRepository.findById(id);
        if (byId.isEmpty()) {
            // allow fetching by username/barberId fallback
            Optional<User> byUsername = userRepository.findByUsername(id);
            if (byUsername.isEmpty()) {
                return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(toProfile(byUsername.get()), HttpStatus.OK);
        }
        return new ResponseEntity<>(toProfile(byId.get()), HttpStatus.OK);
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable String id, @RequestBody UpdateProfileRequest body) {
        Optional<User> byId = userRepository.findById(id);
        User u = byId.orElseGet(() -> userRepository.findByUsername(id).orElse(null));
        if (u == null) {
            return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
        }
        if (u.getRole() != UserRole.BARBER) {
            return new ResponseEntity<>("Only barbers can update profile", HttpStatus.FORBIDDEN);
        }
        if (body.bio != null) u.setBio(body.bio);
        if (body.avatarUrl != null) u.setAvatarUrl(body.avatarUrl);
        userRepository.save(u);
        try {
            java.util.Map<String, Object> meta = new java.util.HashMap<>();
            meta.put("userId", u.getId());
            meta.put("barberId", u.getBarberId());
            notificationService.publish(
                "PROFILE_UPDATE",
                "Barber profile updated",
                u.getUsername() + " updated profile details.",
                u.getId(),
                u.getId(),
                meta
            );
        } catch (Exception ignored) {}
        return new ResponseEntity<>(toProfile(u), HttpStatus.OK);
    }

    @PostMapping(path = "/{id}/avatar", consumes = { "multipart/form-data" })
    public ResponseEntity<?> uploadAvatar(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return new ResponseEntity<>("No file", HttpStatus.BAD_REQUEST);
        }
        Optional<User> byId = userRepository.findById(id);
        User u = byId.orElseGet(() -> userRepository.findByUsername(id).orElse(null));
        if (u == null) {
            return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
        }
        if (u.getRole() != UserRole.BARBER) {
            return new ResponseEntity<>("Only barbers can update avatar", HttpStatus.FORBIDDEN);
        }
        try {
            java.nio.file.Path root = java.nio.file.Paths.get("uploads", "avatars");
            java.nio.file.Path absRoot = root.toAbsolutePath();
            java.nio.file.Files.createDirectories(absRoot);
            // Debug info about where we are saving
            System.out.println("[uploadAvatar] Saving to: " + absRoot);
            String ext = getExt(file.getOriginalFilename());
            String safeName = (u.getUsername() != null ? u.getUsername() : u.getId());
            String fname = safeName + "-" + System.currentTimeMillis() + (ext.isEmpty() ? "" : ("." + ext));
            java.nio.file.Path target = absRoot.resolve(fname);
            // Ensure parent exists
            java.nio.file.Files.createDirectories(target.getParent());
            file.transferTo(target.toAbsolutePath().toFile());
            String publicUrl = "/uploads/avatars/" + fname;
            u.setAvatarUrl(publicUrl);
            userRepository.save(u);
            try {
                java.util.Map<String, Object> meta = new java.util.HashMap<>();
                meta.put("userId", u.getId());
                meta.put("barberId", u.getBarberId());
                meta.put("avatarUrl", publicUrl);
                notificationService.publish(
                    "PROFILE_UPDATE",
                    "Barber profile updated",
                    u.getUsername() + " updated profile picture.",
                    u.getId(),
                    u.getId(),
                    meta
                );
            } catch (Exception ignored) {}
            return new ResponseEntity<>(toProfile(u), HttpStatus.OK);
        } catch (Exception ex) {
            ex.printStackTrace();
            return new ResponseEntity<>("Failed to save avatar", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0,1).toUpperCase() + s.substring(1);
    }

    public static class BarberView {
        public String id;        // barberId used across the app
        public String username;  // login/display reference
        public String name;      // display name
        public String bio;       // optional bio
        public String avatarUrl; // optional avatar
        public java.time.Instant createdAt; // date added
        public double ratingAverage;
        public long ratingCount;
    }

    private ProfileView toProfile(User u) {
        ProfileView p = new ProfileView();
        p.id = u.getId();
        p.username = u.getUsername();
        p.role = u.getRole();
        p.barberId = u.getBarberId();
        p.bio = u.getBio();
        p.avatarUrl = u.getAvatarUrl();
        return p;
    }

    public static class ProfileView {
        public String id;
        public String username;
        public UserRole role;
        public String barberId;
        public String bio;
        public String avatarUrl;
    }

    public static class UpdateProfileRequest {
        public String bio;
        public String avatarUrl;
    }

    private String getExt(String name) {
        if (name == null) return "";
        int i = name.lastIndexOf('.')
;        if (i < 0) return "";
        return name.substring(i+1).toLowerCase();
    }
}
