package com.murali.cabbooking.security;

import com.murali.cabbooking.entity.User;
import com.murali.cabbooking.repository.AdminRepository;
import com.murali.cabbooking.repository.UserRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    public CustomUserDetailsService(UserRepository userRepository, AdminRepository adminRepository) {
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        var admin = adminRepository.findByEmailIgnoreCase(email);
        if (admin.isPresent()) {
            return new org.springframework.security.core.userdetails.User(
                    admin.get().getEmail(),
                    admin.get().getPassword(),
                    Collections.singleton(() -> "ROLE_ADMIN")
            );
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singleton(() -> "ROLE_" + user.getRole().name())
        );
    }
}