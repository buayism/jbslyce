package com.barbercut.reservation.controller;

import com.barbercut.reservation.model.ReservationStatus;

public class ReservationStatusUpdateRequest {
    private ReservationStatus status;

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }
}