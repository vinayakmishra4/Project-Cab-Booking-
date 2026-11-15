package com.murali.cabbooking.repository;

import com.murali.cabbooking.entity.User;
import com.murali.cabbooking.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmployeeId(String employeeId);
    boolean existsByLicenseNumber(String licenseNumber);
    boolean existsByLicenseNumberIgnoreCase(String licenseNumber);
    long countByRole(Role role);
    long countByRoleAndEnabledTrue(Role role);
}