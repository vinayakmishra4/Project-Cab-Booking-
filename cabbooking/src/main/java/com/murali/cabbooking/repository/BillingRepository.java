package com.murali.cabbooking.repository;

import com.murali.cabbooking.entity.Billing;
import com.murali.cabbooking.entity.Ride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface BillingRepository extends JpaRepository<Billing, Long> {
    List<Billing> findByRideIn(Collection<Ride> rides);
}
