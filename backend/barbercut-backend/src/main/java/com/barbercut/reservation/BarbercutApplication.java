package com.barbercut.reservation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication(scanBasePackages = "com.barbercut")
@EnableMongoRepositories(basePackages = "com.barbercut")
public class BarbercutApplication {

    public static void main(String[] args) {
        SpringApplication.run(BarbercutApplication.class, args);
    }
}


