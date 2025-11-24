package com.barbercut.auth.dto;

import com.barbercut.auth.model.UserRole;

public class RegisterRequest {
    private String email;
    private String username;
    private String password;
    private UserRole role;
    private String barberId;

    // Constructors
    public RegisterRequest() {
    }

    public RegisterRequest(String email, String username, String password, UserRole role, String barberId) {
        this.email = email;
        this.username = username;
        this.password = password;
        this.role = role;
        this.barberId = barberId;
    }

    // Getters and setters
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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
}