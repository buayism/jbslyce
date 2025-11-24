package com.barbercut.auth.dto;

import com.barbercut.auth.model.UserRole;

public class AuthResponse {
    private String id;
    private String email;
    private String username;
    private UserRole role;
    private String barberId;
    private String message;
    private String token;

    public AuthResponse() {
    }

    public AuthResponse(String id, String email, String username, UserRole role, String barberId) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.role = role;
        this.barberId = barberId;
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getBarberId() {
        return barberId;
    }

    public void setBarberId(String barberId) {
        this.barberId = barberId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}