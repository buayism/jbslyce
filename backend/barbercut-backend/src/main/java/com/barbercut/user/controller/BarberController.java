package com.barbercut.user.controller;

import com.barbercut.rating.model.Rating;
import com.barbercut.rating.repository.RatingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.DoubleSummaryStatistics;
import java.util.List;

@RestController
@RequestMapping("/api/barbers")
@CrossOrigin(origins = "*")
public class BarberController {

    @Autowired
    private RatingRepository ratingRepository;

    public static class RatingSummary {
        public double averageRating;
        public long reviewCount;
    }

    @GetMapping("/{barberId}/rating-summary")
    public ResponseEntity<RatingSummary> getRatingSummary(@PathVariable String barberId) {
        List<Rating> list = ratingRepository.findByBarberId(barberId);
        DoubleSummaryStatistics stats = list.stream().mapToDouble(Rating::getRating).summaryStatistics();
        RatingSummary out = new RatingSummary();
        out.reviewCount = stats.getCount();
        out.averageRating = stats.getCount() == 0 ? 0.0 : Math.round((stats.getAverage()) * 10.0) / 10.0; // 1 decimal
        return new ResponseEntity<>(out, HttpStatus.OK);
    }
}
