package com.example.authservice.controller;

import com.example.authservice.dto.LoginRequest;
import com.example.authservice.dto.RefreshTokenRequest;
import com.example.authservice.dto.RegisterRequest;
import com.example.authservice.dto.TokenResponse;
import com.example.authservice.dto.UserProfileResponse;
import com.example.authservice.service.AuthUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthUserController {

    private final AuthUserService authUserService;

    public AuthUserController(AuthUserService authUserService) {
        this.authUserService = authUserService;
    }

    @PostMapping("/register/courier")
    @ResponseStatus(HttpStatus.CREATED)
    public void registerCourier(@Valid @RequestBody RegisterRequest request) {
        authUserService.registerCourier(request);
    }

    @PostMapping("/register/dispatcher")
    @ResponseStatus(HttpStatus.CREATED)
    public void registerDispatcher(@Valid @RequestBody RegisterRequest request) {
        authUserService.registerDispatcher(request);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authUserService.login(request);
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authUserService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshTokenRequest request) {
        authUserService.logout(request.refreshToken());
    }

    @GetMapping({"/profile"})
    public UserProfileResponse getProfileData(@AuthenticationPrincipal Jwt jwt) {
        return authUserService.getProfileData(jwt);
    }
}