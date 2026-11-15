package com.murali.cabbooking.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehicle_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String carNumber;

    private String model;

    private String vehicleType;

    private Double latitude;

    private Double longitude;

    private boolean available;
    private boolean online;
    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;
}