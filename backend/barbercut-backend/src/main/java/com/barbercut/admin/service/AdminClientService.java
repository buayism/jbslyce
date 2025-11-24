package com.barbercut.admin.service;

import com.barbercut.admin.dto.AdminClientView;
import com.barbercut.auth.model.User;
import com.barbercut.auth.model.UserRole;
import com.barbercut.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminClientService {

    @Autowired
    private UserRepository userRepository;

    public List<AdminClientView> findAll() {
        List<User> clients = userRepository.findByRole(UserRole.CLIENT);
        
        return clients.stream()
                .map(this::toAdminView)
                .sorted(Comparator.comparing(AdminClientView::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    public AdminClientView ban(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found"));
        
        if (user.getRole() != UserRole.CLIENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a client");
        }
        
        user.setStatus("banned");
        User updated = userRepository.save(user);
        return toAdminView(updated);
    }

    public void delete(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found"));
        
        if (user.getRole() != UserRole.CLIENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a client");
        }
        
        userRepository.deleteById(id);
    }

    private AdminClientView toAdminView(User user) {
        String displayName = user.getUsername() != null ? capitalize(user.getUsername()) : "Unknown";
        String status = user.getStatus() != null ? user.getStatus() : "active";
        
        return new AdminClientView(
                user.getId(),
                displayName,
                user.getEmail(),
                null, // Phone not in User model, set to null
                status,
                user.getCreatedAt()
        );
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}
