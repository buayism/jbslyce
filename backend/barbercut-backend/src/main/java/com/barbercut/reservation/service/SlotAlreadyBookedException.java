package com.barbercut.reservation.service;

public class SlotAlreadyBookedException extends Exception {
    public SlotAlreadyBookedException(String message) {
        super(message);
    }
}