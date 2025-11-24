package com.barbercut.rating.controller;

import com.barbercut.rating.model.Rating;
import com.barbercut.auth.model.User;
import com.barbercut.auth.repository.UserRepository;
import com.barbercut.rating.repository.RatingRepository;
import com.barbercut.reservation.model.Reservation;
import com.barbercut.reservation.model.ReservationStatus;
import com.barbercut.reservation.repository.ReservationRepository;
import com.barbercut.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/ratings")
@CrossOrigin(origins = "*")
public class RatingController {

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public static class CreateRatingRequest {
        public String barberId;
        public String clientId;
        public String reservationId;
        public double rating; // 1-5
        public String feedback;
    }

    public static class AverageResponse {
        public String barberId;
        public double average;
        public long count;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateRatingRequest body) {
        if (body == null || body.barberId == null || body.clientId == null || body.reservationId == null) {
            return new ResponseEntity<>("Missing required fields", HttpStatus.BAD_REQUEST);
        }
        if (body.rating < 1.0 || body.rating > 5.0) {
            return new ResponseEntity<>("Rating must be between 1 and 5", HttpStatus.BAD_REQUEST);
        }

        Optional<Reservation> resOpt = reservationRepository.findById(body.reservationId);
        if (resOpt.isEmpty()) {
            return new ResponseEntity<>("Reservation not found", HttpStatus.NOT_FOUND);
        }
        Reservation res = resOpt.get();
        if (!body.barberId.equals(res.getBarberId()) || !body.clientId.equals(res.getClientId())) {
            return new ResponseEntity<>("Reservation does not match barber/client", HttpStatus.FORBIDDEN);
        }
        if (res.getStatus() != ReservationStatus.COMPLETED) {
            return new ResponseEntity<>("You can only rate a completed reservation", HttpStatus.FORBIDDEN);
        }

        Optional<Rating> existing = ratingRepository.findByReservationIdAndClientId(body.reservationId, body.clientId);
        if (existing.isPresent()) {
            return new ResponseEntity<>("You have already rated this reservation", HttpStatus.CONFLICT);
        }

        Rating rating = new Rating(body.barberId, body.clientId, body.reservationId, body.rating, body.feedback);
        ratingRepository.save(rating);
        try {
            java.util.Map<String, Object> meta = new java.util.HashMap<>();
            meta.put("barberId", body.barberId);
            meta.put("clientId", body.clientId);
            meta.put("reservationId", body.reservationId);
            meta.put("rating", body.rating);
            notificationService.publish(
                "RATING_REVIEW",
                "New rating & review",
                "Barber " + body.barberId + " received " + body.rating + "★",
                body.clientId,
                rating.getId(),
                meta
            );
        } catch (Exception ignored) {}
        return new ResponseEntity<>(rating, HttpStatus.CREATED);
    }

    @GetMapping("/barber/{barberId}/average")
    public ResponseEntity<AverageResponse> getAverage(@PathVariable String barberId) {
        List<Rating> list = ratingRepository.findByBarberId(barberId);
        DoubleSummaryStatistics stats = list.stream().mapToDouble(Rating::getRating).summaryStatistics();
        AverageResponse out = new AverageResponse();
        out.barberId = barberId;
        out.count = stats.getCount();
        out.average = stats.getCount() == 0 ? 0.0 : Math.round((stats.getAverage()) * 10.0) / 10.0; // 1 decimal
        return new ResponseEntity<>(out, HttpStatus.OK);
    }

    @GetMapping("/barber/{barberId}")
    public ResponseEntity<List<RatingView>> listForBarber(@PathVariable String barberId) {
        List<Rating> list = ratingRepository.findByBarberId(barberId);
        java.util.Map<String, String> clientNames = new java.util.HashMap<>();
        List<RatingView> out = new java.util.ArrayList<>();
        for (Rating r : list) {
            String name = clientNames.get(r.getClientId());
            if (name == null) {
                try {
                    java.util.Optional<User> u = userRepository.findById(r.getClientId());
                    name = u.map(User::getUsername).orElse("Anonymous");
                } catch (Exception ignored) { name = "Anonymous"; }
                clientNames.put(r.getClientId(), name);
            }
            RatingView v = new RatingView();
            v.id = r.getId();
            v.barberId = r.getBarberId();
            v.clientId = r.getClientId();
            v.clientName = name;
            v.reservationId = r.getReservationId();
            v.rating = r.getRating();
            v.feedback = r.getFeedback();
            v.reply = r.getReply();
            v.createdAt = r.getCreatedAt();
            out.add(v);
        }
        // Sort most recent first
        out.sort((a,b) -> java.util.Comparator.<java.time.Instant>naturalOrder().reversed().compare(a.createdAt, b.createdAt));
        return new ResponseEntity<>(out, HttpStatus.OK);
    }

    public static class RatingView {
        public String id;
        public String barberId;
        public String clientId;
        public String clientName;
        public String barberName;
        public String barberAvatarUrl;
        public String reservationId;
        public double rating;
        public String feedback;
        public String reply;
        public java.time.Instant createdAt;
    }

    @GetMapping("/reservation/{reservationId}/mine")
    public ResponseEntity<?> hasRated(@PathVariable String reservationId, @RequestParam("clientId") String clientId) {
        Optional<Rating> existing = ratingRepository.findByReservationIdAndClientId(reservationId, clientId);
        if (existing.isPresent()) {
            return new ResponseEntity<>(existing.get(), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<RatingView>> listForClient(@PathVariable String clientId) {
        List<Rating> list = ratingRepository.findByClientId(clientId);
        java.util.Map<String, String> barberNames = new java.util.HashMap<>();
        java.util.Map<String, String> barberAvatars = new java.util.HashMap<>();
        List<RatingView> out = new java.util.ArrayList<>();
        for (Rating r : list) {
            String name = barberNames.get(r.getBarberId());
            if (name == null) {
                try {
                    // Find barber by barberId (which might be stored in user.barberId field)
                    List<User> users = userRepository.findAll();
                    java.util.Optional<User> match = users.stream()
                        .filter(u -> r.getBarberId().equals(u.getBarberId()))
                        .findFirst();
                    name = match.map(User::getUsername).orElse("Barber");
                    String avatar = match.map(User::getAvatarUrl).orElse(null);
                    barberAvatars.put(r.getBarberId(), avatar);
                } catch (Exception ignored) { name = "Barber"; }
                barberNames.put(r.getBarberId(), name);
            }
            RatingView v = new RatingView();
            v.id = r.getId();
            v.barberId = r.getBarberId();
            v.barberName = name;
            v.barberAvatarUrl = barberAvatars.getOrDefault(r.getBarberId(), null);
            v.clientId = r.getClientId();
            v.reservationId = r.getReservationId();
            v.rating = r.getRating();
            v.feedback = r.getFeedback();
            v.reply = r.getReply();
            v.createdAt = r.getCreatedAt();
            out.add(v);
        }
        // Sort most recent first
        out.sort((a,b) -> java.util.Comparator.<java.time.Instant>naturalOrder().reversed().compare(a.createdAt, b.createdAt));
        return new ResponseEntity<>(out, HttpStatus.OK);
    }

    public static class ReplyRequest {
        public String reply;
    }

    @PostMapping("/{ratingId}/reply")
    public ResponseEntity<?> submitReply(@PathVariable String ratingId, @RequestBody ReplyRequest body) {
        Optional<Rating> opt = ratingRepository.findById(ratingId);
        if (opt.isEmpty()) {
            return new ResponseEntity<>("Rating not found", HttpStatus.NOT_FOUND);
        }
        Rating rating = opt.get();
        // Note: In production, verify the requesting user is the barber for this rating
        rating.setReply(body.reply);
        ratingRepository.save(rating);
        return new ResponseEntity<>(rating, HttpStatus.OK);
    }
}
