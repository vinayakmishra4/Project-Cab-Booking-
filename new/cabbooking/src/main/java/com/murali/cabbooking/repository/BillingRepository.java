package com.murali.cabbooking.repository;

import com.murali.cabbooking.entity.Billing;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingRepository extends JpaRepository<Billing, Long> {
}
