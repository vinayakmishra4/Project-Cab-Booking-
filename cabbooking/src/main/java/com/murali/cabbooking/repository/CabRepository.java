package com.murali.cabbooking.repository;

import com.murali.cabbooking.entity.Cab;
import com.murali.cabbooking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CabRepository extends JpaRepository<Cab, Long> {

    // find cab by driver
    List<Cab> findByDriver(User driver);
    Optional<Cab> findFirstByDriverOrderByIdAsc(User driver);
    boolean existsByDriver(User driver);
    boolean existsByCarNumberIgnoreCase(String carNumber);

    // find all available cabs
    List<Cab> findByAvailableTrue();
    long countByAvailableTrue();
    long countByOnlineTrue();

    // 🔥 ADD THIS METHOD
    List<Cab> findByAvailableTrueAndOnlineTrue();
}