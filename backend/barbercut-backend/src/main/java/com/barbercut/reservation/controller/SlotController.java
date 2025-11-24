package com.barbercut.reservation.controller;

import com.barbercut.reservation.model.Slot;
import com.barbercut.reservation.model.Reservation;
import com.barbercut.reservation.model.ReservationStatus;
import com.barbercut.reservation.repository.SlotRepository;
import com.barbercut.reservation.repository.ReservationRepository;
import com.barbercut.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/slots")
@CrossOrigin(origins = "*")
public class SlotController {

    @Autowired
    private SlotRepository slotRepository;
    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private NotificationService notificationService;

    @PostMapping
    public ResponseEntity<?> createSlot(@RequestBody SlotRequest request) {
        try {
            Instant start = Instant.parse(request.getStartISO());
            
            // Use provided duration if specified, otherwise default to 60 minutes (1 hour)
            // This allows flexibility for barbers to create 30-min or 60-min slots
            long duration = request.getDurationMinutes() > 0 ? request.getDurationMinutes() : 60;
            Instant end = start.plus(duration, ChronoUnit.MINUTES);

            if (slotRepository.existsByBarberIdAndStart(request.getBarberId(), start)) {
                return new ResponseEntity<>("Slot already exists for this start time", HttpStatus.CONFLICT);
            }

            Slot saved = slotRepository.save(new Slot(request.getBarberId(), start, end));
            // Notify admin: slot created by barber
            try {
                java.util.Map<String, Object> meta = new java.util.HashMap<>();
                meta.put("barberId", request.getBarberId());
                meta.put("start", saved.getStart());
                notificationService.publish(
                        "SLOT_CREATED",
                        "New slot created",
                        "Barber " + request.getBarberId() + " created a slot at " + saved.getStart(),
                        request.getBarberId(),
                        saved.getId(),
                        meta
                );
            } catch (Exception ignored) {}
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Invalid slot payload", HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/barber/{barberId}")
    public ResponseEntity<List<Slot>> getSlotsForBarber(@PathVariable String barberId) {
        List<Slot> slots = slotRepository.findByBarberIdOrderByStartAsc(barberId);
        // Filter out slots that already have an active reservation (PENDING or APPROVED) at the same instant
        List<Reservation> reservations = reservationRepository.findByBarberId(barberId);
        java.util.Set<java.time.Instant> takenInstants = new java.util.HashSet<>();
        for (Reservation r : reservations) {
            if (r.getSlot() != null && (r.getStatus() == ReservationStatus.PENDING || r.getStatus() == ReservationStatus.APPROVED)) {
                takenInstants.add(r.getSlot());
            }
        }
        // Exclude expired slots: when start time is now or in the past
        java.time.Instant now = java.time.Instant.now();
        List<Slot> available = new java.util.ArrayList<>();
        for (Slot s : slots) {
            if (s.getStart() != null 
                && s.getStart().isAfter(now) 
                && !takenInstants.contains(s.getStart())) {
                available.add(s);
            }
        }
        return new ResponseEntity<>(available, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSlot(@PathVariable String id) {
        try {
            Slot slot = slotRepository.findById(id).orElse(null);
            if (slot == null) {
                return new ResponseEntity<>("Slot not found", HttpStatus.NOT_FOUND);
            }

            // Check if slot has any active reservations (PENDING, APPROVED, IN_PROGRESS)
            List<Reservation> reservations = reservationRepository.findByBarberId(slot.getBarberId());
            for (Reservation r : reservations) {
                if (r.getSlot() != null && r.getSlot().equals(slot.getStart())) {
                    ReservationStatus status = r.getStatus();
                    if (status == ReservationStatus.PENDING || 
                        status == ReservationStatus.APPROVED || 
                        status == ReservationStatus.IN_PROGRESS) {
                        return new ResponseEntity<>("Cannot delete slot with active reservation (status: " + status + ")", HttpStatus.CONFLICT);
                    }
                }
            }

            // Safe to delete - no active reservations
            slotRepository.deleteById(id);
            return new ResponseEntity<>("Slot deleted successfully", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete slot: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return new ResponseEntity<>("slots-ok", HttpStatus.OK);
    }

    public static class SlotRequest {
        private String barberId;
        private String startISO; // ISO-8601 string
        private long durationMinutes;

        public SlotRequest() {}

        public String getBarberId() { return barberId; }
        public void setBarberId(String barberId) { this.barberId = barberId; }
        public String getStartISO() { return startISO; }
        public void setStartISO(String startISO) { this.startISO = startISO; }
        public long getDurationMinutes() { return durationMinutes; }
        public void setDurationMinutes(long durationMinutes) { this.durationMinutes = durationMinutes; }
    }
}
