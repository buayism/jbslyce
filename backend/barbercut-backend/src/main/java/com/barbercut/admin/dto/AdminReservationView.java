package com.barbercut.admin.dto;

import com.barbercut.reservation.model.ReservationStatus;

import java.time.Instant;

public class AdminReservationView {
    private String id;
    private String clientId;
    private String clientName;
    private String barberId;
    private String barberName;
    private Instant slot;
    private ReservationStatus status;
    private String notes;
    private String serviceName;
    private int serviceDurationMinutes;

    public AdminReservationView() {}

    public AdminReservationView(String id, String clientId, String clientName, String barberId, String barberName, 
                                Instant slot, ReservationStatus status, String notes, String serviceName, int serviceDurationMinutes) {
        this.id = id;
        this.clientId = clientId;
        this.clientName = clientName;
        this.barberId = barberId;
        this.barberName = barberName;
        this.slot = slot;
        this.status = status;
        this.notes = notes;
        this.serviceName = serviceName;
        this.serviceDurationMinutes = serviceDurationMinutes;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getBarberId() { return barberId; }
    public void setBarberId(String barberId) { this.barberId = barberId; }

    public String getBarberName() { return barberName; }
    public void setBarberName(String barberName) { this.barberName = barberName; }

    public Instant getSlot() { return slot; }
    public void setSlot(Instant slot) { this.slot = slot; }

    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public int getServiceDurationMinutes() { return serviceDurationMinutes; }
    public void setServiceDurationMinutes(int serviceDurationMinutes) { this.serviceDurationMinutes = serviceDurationMinutes; }
}
