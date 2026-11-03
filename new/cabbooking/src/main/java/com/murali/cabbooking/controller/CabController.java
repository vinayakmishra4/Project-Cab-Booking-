package com.murali.cabbooking.controller;

import com.murali.cabbooking.entity.Cab;
import com.murali.cabbooking.repository.CabRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cab")   // ✅ CHANGED BASE PATH
@RequiredArgsConstructor
public class CabController {

    private final CabRepository cabRepository;

    // 🔎 Get all available cabs
    @GetMapping("/available")
    public List<Cab> getAvailableCabs() {
        return cabRepository.findByAvailableTrue();
    }

    // 🔎 Get all cabs (admin usage)
    @GetMapping("/all")
    public List<Cab> getAllCabs() {
        return cabRepository.findAll();
    }
}