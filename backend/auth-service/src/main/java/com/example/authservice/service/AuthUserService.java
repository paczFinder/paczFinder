package com.example.authservice.service;

import com.example.authservice.dto.LoginRequest;
import com.example.authservice.dto.RegisterRequest;
import com.example.authservice.dto.TokenResponse;
import com.example.authservice.dto.UserProfileResponse;
import com.example.authservice.model.User;
import com.example.authservice.model.UserRole;
import com.example.authservice.repository.AuthUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthUserService {

    private static final Logger log =
            LoggerFactory.getLogger(AuthUserService.class);

    private final AuthUserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;

    public AuthUserService(AuthUserRepository userRepository, KeycloakAdminService keycloakAdminService) {
        this.userRepository = userRepository;
        this.keycloakAdminService = keycloakAdminService;
    }

    @Transactional
    public void  registerCourier(RegisterRequest request) {
        registerWithRole(request, UserRole.COURIER);
    }

    @Transactional
    public void registerDispatcher(RegisterRequest request) {
        registerWithRole(request, UserRole.DISPATCHER);
    }

    private void registerWithRole(RegisterRequest request, UserRole role) {
//        if (userRepository.existsByEmail(request.email())) {
//            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
//        }
        if (role != UserRole.COURIER && role != UserRole.DISPATCHER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
        }

        String keycloakId = keycloakAdminService.registerUser(request);

        keycloakAdminService.assignRealmRole(keycloakId, role);

        User user = new User(
                keycloakId,
                request.name(),
                request.surname(),
                request.email(),
                role
        );
//        user = userRepository.save(user);

//        return UserProfileResponse.from(user);
        userRepository.save(user);
        log.info(
                "Registration completed successfully. Keycloak ID: {}, Role: {}",
                user.getEmail(),
                role
        );
    }


    public TokenResponse login(LoginRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            if (!user.isActive()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is inactive");
            }
        });

        try {
            TokenResponse response = keycloakAdminService.login(request);
            log.info("Login successful.");
            return response;
        } catch (ResponseStatusException e) {
            log.warn("Login failed. Status: {}", e.getStatusCode());
            throw e;
        }
    }

    public TokenResponse refresh(String refreshToken) {
        return keycloakAdminService.refresh(refreshToken);
    }

    public void logout(String refreshToken) {
        keycloakAdminService.logout(refreshToken);
    }

    public UserProfileResponse getProfileData(Jwt jwt) {
        String keycloakId = jwt.getSubject();

        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User profile not found. Please complete registration first."
                ));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is inactive");
        }

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getSurname(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}