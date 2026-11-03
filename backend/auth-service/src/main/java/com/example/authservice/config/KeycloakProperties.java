package com.example.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "keycloak")
public record KeycloakProperties(
        String serverUrl,
        String realm,
        String clientId,
        String clientSecret,
        String adminUsername,
        String adminPassword
) {
    public String tokenEndpoint() {
        return serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";
    }
}
