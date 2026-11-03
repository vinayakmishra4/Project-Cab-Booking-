package com.murali.cabbooking.repository;

import com.murali.cabbooking.entity.Ride;
import com.murali.cabbooking.entity.Employee;
import com.murali.cabbooking.entity.User;
import com.murali.cabbooking.entity.RideStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface RideRepository extends JpaRepository<Ride, Long> {
    List<Ride> findByUser(User user);
    List<Ride> findByEmployee(Employee employee);
    List<Ride> findByCab_Driver_EmailOrderByCreatedAtDesc(String email);
    long countByStatus(RideStatus status);
    long countByStatusIn(Collection<RideStatus> statuses);

    @EntityGraph(attributePaths = {"employee", "user", "cab", "cab.driver"})
    List<Ride> findTop8ByOrderByCreatedAtDesc();

    @Query(value = """
            SELECT CAST(created_at AS DATE), COUNT(*)
            FROM ride_history
            WHERE created_at >= :fromDate
            GROUP BY CAST(created_at AS DATE)
            ORDER BY CAST(created_at AS DATE)
            """, nativeQuery = true)
    List<Object[]> findDailyBookingCountsSince(@Param("fromDate") LocalDate fromDate);

    @Query("""
            select distinct ride
            from Ride ride
            left join fetch ride.cab cab
            left join fetch cab.driver
            left join fetch ride.employee employee
            left join fetch ride.user user
            where employee.email = :email or user.email = :email
            order by ride.createdAt desc
            """)
    List<Ride> findAllByPassengerEmail(@Param("email") String email);
}