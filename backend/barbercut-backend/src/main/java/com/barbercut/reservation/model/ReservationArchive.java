package com.barbercut.reservation.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "reservation_archives")
public class ReservationArchive {
    @Id
    private String id;

    private String originalReservationId;
    private String barberId;
    private String clientId;
    private Instant slot;
    private ReservationStatus status; // expected DECLINED or CANCELLED, but keep enum for completeness
    private String notes;
    private String serviceName;
    private int serviceDurationMinutes;

    private Instant archivedAt;

    public ReservationArchive() {}

    public ReservationArchive(String originalReservationId, String barberId, String clientId, Instant slot,
                              ReservationStatus status, String notes, Instant archivedAt) {
        this.originalReservationId = originalReservationId;
        this.barberId = barberId;
        this.clientId = clientId;
        this.slot = slot;
        this.status = status;
        this.notes = notes;
        this.archivedAt = archivedAt;
    }
    
    public ReservationArchive(String originalReservationId, String barberId, String clientId, Instant slot,
                              ReservationStatus status, String notes, String serviceName, int serviceDurationMinutes, Instant archivedAt) {
        this.originalReservationId = originalReservationId;
        this.barberId = barberId;
        this.clientId = clientId;
        this.slot = slot;
        this.status = status;
        this.notes = notes;
        this.serviceName = serviceName;
        this.serviceDurationMinutes = serviceDurationMinutes;
        this.archivedAt = archivedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOriginalReservationId() { return originalReservationId; }
    public void setOriginalReservationId(String originalReservationId) { this.originalReservationId = originalReservationId; }

    public String getBarberId() { return barberId; }
    public void setBarberId(String barberId) { this.barberId = barberId; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public Instant getSlot() { return slot; }
    public void setSlot(Instant slot) { this.slot = slot; }

    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getArchivedAt() { return archivedAt; }
    public void setArchivedAt(Instant archivedAt) { this.archivedAt = archivedAt; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public int getServiceDurationMinutes() { return serviceDurationMinutes; }
    public void setServiceDurationMinutes(int serviceDurationMinutes) { this.serviceDurationMinutes = serviceDurationMinutes; }
}
