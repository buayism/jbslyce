package com.barbercut.admin.service;

import com.barbercut.admin.dto.AdminReservationView;
import com.barbercut.auth.model.User;
import com.barbercut.auth.repository.UserRepository;
import com.barbercut.reservation.model.Reservation;
import com.barbercut.reservation.model.ReservationStatus;
import com.barbercut.reservation.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AdminReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    public List<AdminReservationView> findAll(String statusFilter, String sortBy, String dateFrom, String dateTo) {
        List<Reservation> reservations;
        
        // Filter by status if provided
        if (statusFilter != null && !statusFilter.isEmpty()) {
            try {
                ReservationStatus status = ReservationStatus.valueOf(statusFilter.toUpperCase());
                reservations = reservationRepository.findByStatus(status);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + statusFilter);
            }
        } else {
            reservations = reservationRepository.findAll();
        }

        // Apply date range filter if provided
        if (dateFrom != null && !dateFrom.isEmpty()) {
            try {
                java.time.Instant fromInstant = java.time.LocalDate.parse(dateFrom).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
                reservations = reservations.stream()
                        .filter(r -> r.getSlot() != null && !r.getSlot().isBefore(fromInstant))
                        .collect(Collectors.toList());
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid dateFrom format. Use YYYY-MM-DD");
            }
        }
        
        if (dateTo != null && !dateTo.isEmpty()) {
            try {
                java.time.Instant toInstant = java.time.LocalDate.parse(dateTo).atTime(23, 59, 59).atZone(java.time.ZoneId.systemDefault()).toInstant();
                reservations = reservations.stream()
                        .filter(r -> r.getSlot() != null && !r.getSlot().isAfter(toInstant))
                        .collect(Collectors.toList());
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid dateTo format. Use YYYY-MM-DD");
            }
        }

        // Convert to view DTOs with client and barber names
        List<AdminReservationView> views = reservations.stream()
                .map(this::toAdminView)
                .collect(Collectors.toList());

        // Sort if requested
        if (sortBy != null && !sortBy.isEmpty()) {
            if ("date".equalsIgnoreCase(sortBy)) {
                views.sort(Comparator.comparing(AdminReservationView::getSlot).reversed());
            } else if ("status".equalsIgnoreCase(sortBy)) {
                views.sort(Comparator.comparing(v -> v.getStatus().name()));
            }
        } else {
            // Default sort by date descending
            views.sort(Comparator.comparing(AdminReservationView::getSlot).reversed());
        }

        return views;
    }

    public AdminReservationView cancel(String id) {
        Reservation res = reservationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
        
        res.setStatus(ReservationStatus.CANCELLED);
        Reservation updated = reservationRepository.save(res);
        return toAdminView(updated);
    }

    public void delete(String id) {
        if (!reservationRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
        reservationRepository.deleteById(id);
    }

    private AdminReservationView toAdminView(Reservation res) {
        String clientName = getUserName(res.getClientId());
        String barberName = getUserName(res.getBarberId());
        
        return new AdminReservationView(
                res.getId(),
                res.getClientId(),
                clientName,
                res.getBarberId(),
                barberName,
                res.getSlot(),
                res.getStatus(),
                res.getNotes(),
                res.getServiceName(),
                res.getServiceDurationMinutes()
        );
    }

    private String getUserName(String userId) {
        if (userId == null) return "Unknown";
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User u = userOpt.get();
            return u.getUsername() != null ? capitalize(u.getUsername()) : "Unknown";
        }
        return "Unknown";
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}
