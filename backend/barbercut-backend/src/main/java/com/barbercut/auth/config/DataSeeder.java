package com.barbercut.auth.config;

import com.barbercut.admin.model.Barber;
import com.barbercut.admin.repository.BarberRepository;
import com.barbercut.auth.model.User;
import com.barbercut.auth.model.UserRole;
import com.barbercut.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedUsers(UserRepository userRepository) {
        return args -> {
            BCryptPasswordEncoder enc = new BCryptPasswordEncoder();

            if (!userRepository.existsByUsername("admin")) {
                User u = new User("admin@local", "admin", enc.encode("admin123"), UserRole.ADMIN, null);
                userRepository.save(u);
            }
            if (!userRepository.existsByUsername("barber1")) {
                User u = new User("barber1@local", "barber1", enc.encode("barber123"), UserRole.BARBER, "barber1");
                userRepository.save(u);
            }
            if (!userRepository.existsByUsername("client1")) {
                User u = new User("client1@local", "client1", enc.encode("client123"), UserRole.CLIENT, null);
                userRepository.save(u);
            }
        };
    }

    @Bean
    public CommandLineRunner seedBarbers(UserRepository userRepository, BarberRepository barberRepository) {
        return args -> {
            // Ensure a Barber document exists for barber1 (approved for testing)
            userRepository.findByUsername("barber1").ifPresent(user -> {
                String bid = user.getBarberId() != null ? user.getBarberId() : user.getUsername();
                if (!barberRepository.existsById(bid)) {
                    Barber b = new Barber(bid, capitalize(user.getUsername()), user.getEmail(), null, user.getAvatarUrl(), user.getBio(), "approved");
                    barberRepository.save(b);
                }
            });
        };
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0,1).toUpperCase() + s.substring(1);
    }
}
