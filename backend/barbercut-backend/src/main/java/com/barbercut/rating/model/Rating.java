package com.barbercut.rating.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "ratings")
@CompoundIndex(name = "unique_rating_per_reservation", def = "{'reservationId': 1, 'clientId': 1}", unique = true)
public class Rating {

    @Id
    private String id;

    private String barberId;
    private String clientId;
    private String reservationId;

    private double rating; // 1.0 - 5.0
    private String feedback;
    private String reply; // Barber's reply to the rating

    private Instant createdAt;

    public Rating() {}

    public Rating(String barberId, String clientId, String reservationId, double rating, String feedback) {
        this.barberId = barberId;
        this.clientId = clientId;
        this.reservationId = reservationId;
        this.rating = rating;
        this.feedback = feedback;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBarberId() { return barberId; }
    public void setBarberId(String barberId) { this.barberId = barberId; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getReservationId() { return reservationId; }
    public void setReservationId(String reservationId) { this.reservationId = reservationId; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
