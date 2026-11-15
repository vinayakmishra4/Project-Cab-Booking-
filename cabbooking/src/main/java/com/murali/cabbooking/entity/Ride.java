package com.murali.cabbooking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ride_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double pickupLat;
    private Double pickupLng;

    private Double dropLat;
    private Double dropLng;

    private String pickupAddress;

    private String dropoffAddress;

    private Double distanceKm;

    private Double fare;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // ✅ Use ENUM instead of String
    @Enumerated(EnumType.STRING)
    private RideStatus status;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "cab_id")
    private Cab cab;

    @OneToOne(mappedBy = "ride", fetch = FetchType.EAGER)
    private Billing billing;
}