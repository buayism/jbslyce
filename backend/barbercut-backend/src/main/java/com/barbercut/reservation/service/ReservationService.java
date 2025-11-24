package com.barbercut.reservation.service;

import com.barbercut.auth.model.User;
import com.barbercut.auth.repository.UserRepository;
import com.barbercut.reservation.model.Reservation;
import com.barbercut.reservation.model.ReservationStatus;
import com.barbercut.reservation.model.ReservationArchive;
import com.barbercut.reservation.repository.ReservationRepository;
import com.barbercut.reservation.repository.ReservationArchiveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private ReservationArchiveRepository reservationArchiveRepository;
    @Autowired
    private UserRepository userRepository;

    // Default service duration in minutes (temporary testing override)
    private static final int DEFAULT_SERVICE_DURATION_MINUTES = 4;

    public Reservation createReservation(Reservation reservation) throws SlotAlreadyBookedException {
        // Check if client is banned
        if (reservation.getClientId() != null) {
            Optional<User> clientOpt = userRepository.findById(reservation.getClientId());
            if (clientOpt.isPresent()) {
                User client = clientOpt.get();
                if ("banned".equals(client.getStatus())) {
                    throw new RuntimeException("Your account has been banned. You cannot make reservations.");
                }
            }
        }

        // Check for slot collision
        if (reservationRepository.existsByBarberIdAndSlot(reservation.getBarberId(), reservation.getSlot())) {
            throw new SlotAlreadyBookedException("The selected time slot is already booked for this barber.");
        }

        // Set default status to PENDING
        reservation.setStatus(ReservationStatus.PENDING);

        return reservationRepository.save(reservation);
    }

    public List<Reservation> getClientReservations(String clientId) {
        return reservationRepository.findByClientId(clientId);
    }

    public List<Reservation> getPendingReservationsForBarber(String barberId) {
        return reservationRepository.findByBarberIdAndStatus(barberId, ReservationStatus.PENDING);
    }

    public List<Reservation> getAllReservationsForBarber(String barberId) {
        return reservationRepository.findByBarberId(barberId);
    }

    public Reservation updateReservationStatus(String id, ReservationStatus status)
            throws ReservationNotFoundException {
        Optional<Reservation> optionalReservation = reservationRepository.findById(id);
        if (optionalReservation.isPresent()) {
            Reservation reservation = optionalReservation.get();
            // If barber declines or reservation is cancelled, archive then delete to free the slot immediately
            if (status == ReservationStatus.DECLINED || status == ReservationStatus.CANCELLED) {
                reservation.setStatus(status);
                // Archive the reservation for history
                ReservationArchive archive = new ReservationArchive(
                        reservation.getId(),
                        reservation.getBarberId(),
                        reservation.getClientId(),
                        reservation.getSlot(),
                        status,
                        reservation.getNotes(),
                        reservation.getServiceName(),
                        reservation.getServiceDurationMinutes(),
                        Instant.now()
                );
                reservationArchiveRepository.save(archive);
                // Remove the record to allow new reservations for the same slot (due to unique index)
                reservationRepository.deleteById(id);
                // Return the previous reservation payload (now deleted) for client UI acknowledgement
                return reservation;
            } else {
                reservation.setStatus(status);
                return reservationRepository.save(reservation);
            }
        } else {
            throw new ReservationNotFoundException("Reservation with ID " + id + " not found.");
        }
    }

    public boolean existsByBarberIdAndSlot(String barberId, Instant slot) {
        return reservationRepository.existsByBarberIdAndSlot(barberId, slot);
    }

    public void deleteReservation(String id) throws ReservationNotFoundException {
        Optional<Reservation> optionalReservation = reservationRepository.findById(id);
        if (optionalReservation.isPresent()) {
            reservationRepository.deleteById(id);
        } else {
            throw new ReservationNotFoundException("Reservation with ID " + id + " not found.");
        }
    }

    /**
     * Determines the effective status of a reservation based on current time.
     * If the reservation slot time has passed, it should be IN_PROGRESS or COMPLETED.
     */
    public ReservationStatus getEffectiveStatus(Reservation reservation) {
        Instant now = Instant.now();
        Instant slotTime = reservation.getSlot();
        
        // Temporarily force all services to use the default duration for testing
        int duration = DEFAULT_SERVICE_DURATION_MINUTES;
        
        Instant serviceEndTime = slotTime.plus(duration, ChronoUnit.MINUTES);

        // If the service has ended, mark as COMPLETED
        if (now.isAfter(serviceEndTime) || now.equals(serviceEndTime)) {
            return ReservationStatus.COMPLETED;
        }

        // If the slot time has started but service hasn't ended, mark as IN_PROGRESS
        if (now.isAfter(slotTime) || now.equals(slotTime)) {
            return ReservationStatus.IN_PROGRESS;
        }

        // Otherwise, return the stored status
        return reservation.getStatus();
    }

    /**
     * Auto-updates a reservation's status based on time if needed.
     */
    public Reservation autoUpdateStatus(Reservation reservation) {
        ReservationStatus effectiveStatus = getEffectiveStatus(reservation);
        if (effectiveStatus != reservation.getStatus()) {
            reservation.setStatus(effectiveStatus);
            return reservationRepository.save(reservation);
        }
        return reservation;
    }

    /**
     * Auto-updates all reservations for a barber based on time.
     */
    public void autoUpdateReservationsForBarber(String barberId) {
        List<Reservation> reservations = getAllReservationsForBarber(barberId);
        for (Reservation reservation : reservations) {
            if (reservation.getStatus() == ReservationStatus.APPROVED || 
                reservation.getStatus() == ReservationStatus.IN_PROGRESS) {
                autoUpdateStatus(reservation);
            }
        }
    }
}