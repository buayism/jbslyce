package com.barbercut.reservation.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "reservations")
@CompoundIndex(name = "barber_slot_idx", def = "{'barberId': 1, 'slot': 1}", unique = true)
public class Reservation {

    @Id
    private String id;

    private String barberId;
    private String clientId;
    private Instant slot;

    private ReservationStatus status;

    private String notes;
    
    // Service information
    private String serviceName;
    private int serviceDurationMinutes;

    public Reservation() {
    }

    public Reservation(String barberId, String clientId, Instant slot, String notes) {
        this.barberId = barberId;
        this.clientId = clientId;
        this.slot = slot;
        this.notes = notes;
        this.status = ReservationStatus.PENDING;
    }

    public Reservation(String barberId, String clientId, Instant slot, String notes, String serviceName, int serviceDurationMinutes) {
        this.barberId = barberId;
        this.clientId = clientId;
        this.slot = slot;
        this.notes = notes;
        this.serviceName = serviceName;
        this.serviceDurationMinutes = serviceDurationMinutes;
        this.status = ReservationStatus.PENDING;
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBarberId() {
        return barberId;
    }

    public void setBarberId(String barberId) {
        this.barberId = barberId;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public Instant getSlot() {
        return slot;
    }

    public void setSlot(Instant slot) {
        this.slot = slot;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public int getServiceDurationMinutes() {
        return serviceDurationMinutes;
    }

    public void setServiceDurationMinutes(int serviceDurationMinutes) {
        this.serviceDurationMinutes = serviceDurationMinutes;
    }
}