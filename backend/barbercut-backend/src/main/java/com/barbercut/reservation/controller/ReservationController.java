package com.barbercut.reservation.controller;

import com.barbercut.auth.model.User;
import com.barbercut.auth.repository.UserRepository;
import com.barbercut.notification.service.NotificationService;
import com.barbercut.reservation.model.Reservation;
import com.barbercut.reservation.model.ReservationStatus;
import com.barbercut.reservation.service.ReservationService;
import com.barbercut.reservation.service.SlotAlreadyBookedException;
import com.barbercut.reservation.service.ReservationNotFoundException;
import com.barbercut.reservation.model.ReservationArchive;
import com.barbercut.reservation.repository.ReservationArchiveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class ReservationController {

    @Autowired
    private ReservationService reservationService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ReservationArchiveRepository reservationArchiveRepository;
    @Autowired
    private NotificationService notificationService;

    // --- Mapping helpers and DTO ---
    private ReservationView toView(Reservation r) {
        ReservationView v = new ReservationView();
        v.id = r.getId();
        v.barberId = r.getBarberId();
        v.clientId = r.getClientId();
        v.slot = r.getSlot();
        v.status = r.getStatus();
        v.notes = r.getNotes();
        v.serviceName = r.getServiceName();
        v.serviceDurationMinutes = r.getServiceDurationMinutes();
        try {
            java.util.Optional<User> u = userRepository.findById(r.getClientId());
            v.clientUsername = u.map(User::getUsername).orElse(null);
        } catch (Exception ignored) {}
        return v;
    }

    private java.util.List<ReservationView> toViews(java.util.List<Reservation> src) {
        java.util.List<ReservationView> out = new java.util.ArrayList<>();
        for (Reservation r : src) out.add(toView(r));
        return out;
    }

    static class ReservationView {
        public String id;
        public String barberId;
        public String clientId;
        public String clientUsername;
        public java.time.Instant slot;
        public ReservationStatus status;
        public String notes;
        public String serviceName;
        public int serviceDurationMinutes;
    }

    private ReservationView fromArchive(ReservationArchive a) {
        ReservationView v = new ReservationView();
        v.id = a.getId();
        v.barberId = a.getBarberId();
        v.clientId = a.getClientId();
        v.slot = a.getSlot();
        v.status = a.getStatus();
        v.notes = a.getNotes();
        v.serviceName = a.getServiceName();
        v.serviceDurationMinutes = a.getServiceDurationMinutes();
        try {
            java.util.Optional<User> u = userRepository.findById(a.getClientId());
            v.clientUsername = u.map(User::getUsername).orElse(null);
        } catch (Exception ignored) {}
        return v;
    }

    @PostMapping
    public ResponseEntity<?> createReservation(@RequestBody Reservation reservation) {
        try {
            Reservation createdReservation = reservationService.createReservation(reservation);
            try {
                java.util.Map<String, Object> meta = new java.util.HashMap<>();
                meta.put("reservationId", createdReservation.getId());
                meta.put("barberId", createdReservation.getBarberId());
                meta.put("clientId", createdReservation.getClientId());
                meta.put("slot", createdReservation.getSlot());
                notificationService.publish(
                        "BOOKED",
                        "New reservation booked",
                        "Client " + createdReservation.getClientId() + " booked with barber " + createdReservation.getBarberId(),
                        createdReservation.getClientId(),
                        createdReservation.getId(),
                        meta
                );
            } catch (Exception ignored) {}
            return new ResponseEntity<>(toView(createdReservation), HttpStatus.CREATED);
        } catch (SlotAlreadyBookedException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        }
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<ReservationView>> getClientReservations(@PathVariable String clientId) {
        List<Reservation> reservations = reservationService.getClientReservations(clientId);
        // Auto-update statuses based on time
        for (Reservation reservation : reservations) {
            reservationService.autoUpdateStatus(reservation);
        }
        return new ResponseEntity<>(toViews(reservations), HttpStatus.OK);
    }

    @GetMapping("/barber/{barberId}/pending")
    public ResponseEntity<List<ReservationView>> getPendingReservationsForBarber(@PathVariable String barberId) {
        List<Reservation> reservations = reservationService.getPendingReservationsForBarber(barberId);
        return new ResponseEntity<>(toViews(reservations), HttpStatus.OK);
    }

    @GetMapping("/barber/{barberId}/all")
    public ResponseEntity<List<ReservationView>> getAllReservationsForBarber(@PathVariable String barberId) {
        List<Reservation> reservations = reservationService.getAllReservationsForBarber(barberId);
        // Auto-update statuses based on time
        for (Reservation reservation : reservations) {
            reservationService.autoUpdateStatus(reservation);
        }
        return new ResponseEntity<>(toViews(reservations), HttpStatus.OK);
    }

    @GetMapping("/barber/{barberId}/all-merged")
    public ResponseEntity<List<ReservationView>> getAllReservationsForBarberMerged(@PathVariable String barberId) {
        List<Reservation> active = reservationService.getAllReservationsForBarber(barberId);
        // Auto-update statuses based on time
        for (Reservation reservation : active) {
            reservationService.autoUpdateStatus(reservation);
        }
        List<ReservationArchive> archived = reservationArchiveRepository.findByBarberId(barberId);
        java.util.List<ReservationView> out = new java.util.ArrayList<>();
        out.addAll(toViews(active));
        for (ReservationArchive a : archived) out.add(fromArchive(a));
        return new ResponseEntity<>(out, HttpStatus.OK);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateReservationStatus(@PathVariable String id,
            @RequestBody ReservationStatusUpdateRequest request) {
        try {
            Reservation updatedReservation = reservationService.updateReservationStatus(id, request.getStatus());
            try {
                String type = null; String title = null; String body = null;
                if (request.getStatus() == ReservationStatus.APPROVED) {
                    type = "RESERVATION_DECISION"; title = "Reservation approved"; body = "Reservation " + id + " approved by barber.";
                } else if (request.getStatus() == ReservationStatus.DECLINED) {
                    type = "RESERVATION_DECISION"; title = "Reservation declined"; body = "Reservation " + id + " declined by barber.";
                } else if (request.getStatus() == ReservationStatus.COMPLETED) {
                    type = "RESERVATION_COMPLETED"; title = "Reservation completed"; body = "Reservation " + id + " marked as completed.";
                }
                if (type != null) {
                    java.util.Map<String, Object> meta = new java.util.HashMap<>();
                    meta.put("reservationId", id);
                    meta.put("barberId", updatedReservation.getBarberId());
                    meta.put("clientId", updatedReservation.getClientId());
                    notificationService.publish(type, title, body, updatedReservation.getBarberId(), id, meta);
                }
            } catch (Exception ignored) {}
            return new ResponseEntity<>(toView(updatedReservation), HttpStatus.OK);
        } catch (ReservationNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReservation(@PathVariable String id) {
        try {
            reservationService.deleteReservation(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (ReservationNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }
}