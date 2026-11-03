package com.example.authservice.config;

import com.example.authservice.dto.RegisterRequest;
import com.example.authservice.model.UserRole;
import com.example.authservice.repository.AuthUserRepository;
import com.example.authservice.service.AuthUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DefaultUsersInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultUsersInitializer.class);

    private final AuthUserService authUserService;
    private final AuthUserRepository userRepository;

    public DefaultUsersInitializer(AuthUserService authUserService, AuthUserRepository userRepository) {
        this.authUserService = authUserService;
        this.userRepository = userRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        createDefaultUser(
                "Daniel",
                "Kordynatoro",
                "duser@wp.pl",
                "User123!",
                UserRole.DISPATCHER
        );

        createDefaultUser(
                "Cam",
                "Kuriero",
                "cuser@wp.pl",
                "User123!",
                UserRole.COURIER
        );
    }

    private void createDefaultUser(String name, String surname, String email, String password, UserRole role) {
        if (userRepository.existsByEmail(email)) {
            log.info("Default user already exists: {}", email);
            return;
        }

        RegisterRequest request = new RegisterRequest(name, surname, email, password);

        try {
            if (role == UserRole.DISPATCHER) {
                authUserService.registerDispatcher(request);
            } else if (role == UserRole.COURIER) {
                authUserService.registerCourier(request);
            }
            log.info("Created default user: {} ({})", email, role);
        } catch (Exception e) {
            log.warn("Could not create default user {}: {}", email, e.getMessage());
        }
    }
}