package com.example.authservice.service;

import com.example.authservice.config.KeycloakProperties;
import com.example.authservice.dto.LoginRequest;
import com.example.authservice.dto.RegisterRequest;
import com.example.authservice.dto.TokenResponse;
import com.example.authservice.model.UserRole;
import jakarta.annotation.PreDestroy;
import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class KeycloakAdminService {

    private final RestClient restClient;
    private final KeycloakProperties props;
    private final Keycloak keycloak; // Admin Client (realm master / admin-cli)

    public KeycloakAdminService(RestClient restClient, KeycloakProperties props) {
        this.restClient = restClient;
        this.props = props;
        this.keycloak = KeycloakBuilder.builder()
                .serverUrl(props.serverUrl())
                .realm("master")
                .clientId("admin-cli")
                .username(props.adminUsername())
                .password(props.adminPassword())
                .build();
    }

    @PreDestroy
    public void close() {
        if (keycloak != null) {
            keycloak.close();
        }
    }

    public TokenResponse login(LoginRequest request) {
        MultiValueMap<String, String> form = clientForm();
        form.add("grant_type", "password");
        form.add("username", request.email());
        form.add("password", request.password());
        form.add("scope", "openid profile email");

        try {
            return postForm(props.tokenEndpoint(), form).body(TokenResponse.class);
        } catch (RestClientResponseException e) {
            String description = e.getResponseBodyAsString().toLowerCase();
            if (description.contains("not fully set up")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is not fully set up");
            }
            if (description.contains("disabled")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is disabled");
            }
            if (description.contains("invalid_grant")) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Keycloak login failed: " + e.getMessage());
        }
    }

    public TokenResponse refresh(String refreshToken) {
        MultiValueMap<String, String> form = clientForm();
        form.add("grant_type", "refresh_token");
        form.add("refresh_token", refreshToken);

        try {
            return postForm(props.tokenEndpoint(), form).body(TokenResponse.class);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().is4xxClientError()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired, please log in again");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Keycloak token refresh failed: " + e.getMessage());
        }
    }

    public void logout(String refreshToken) {
        MultiValueMap<String, String> form = clientForm();
        form.add("refresh_token", refreshToken);

        try {
            postForm(props.logoutEndpoint(), form).toBodilessEntity();
        } catch (RestClientResponseException e) {
            if (!e.getStatusCode().is4xxClientError()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Keycloak logout failed: " + e.getMessage());
            }
        }
    }

    private MultiValueMap<String, String> clientForm() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", props.clientId());
        form.add("client_secret", props.clientSecret());
        return form;
    }

    private RestClient.ResponseSpec postForm(String uri, MultiValueMap<String, String> form) {
        return restClient.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve();
    }

    public String registerUser(RegisterRequest request) {
        UserRepresentation user = new UserRepresentation();
        user.setUsername(request.email());
        user.setEmail(request.email());
        user.setFirstName(request.name());
        user.setLastName(request.surname());
        user.setEnabled(true);
        user.setEmailVerified(true);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.password());
        credential.setTemporary(false);
        user.setCredentials(List.of(credential));

        RealmResource realmResource = keycloak.realm(props.realm());
        UsersResource usersResource = realmResource.users();

        try (Response response = usersResource.create(user)) {
            int status = response.getStatus();

            if (status == 409) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "User with this email already exists in Keycloak");
            }
            if (status != 201) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Keycloak register failed with status: " + status);
            }

            return CreatedResponseUtil.getCreatedId(response);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Keycloak register failed: " + e.getMessage());
        }
    }

    public void assignRealmRole(String keycloakUserId, UserRole role) {
        RealmResource realmResource = keycloak.realm(props.realm());

        RoleRepresentation roleRep = realmResource.roles()
                .get(role.name())
                .toRepresentation();

        if (roleRep == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Role " + role + " not found in Keycloak");
        }

        UserResource userResource = realmResource.users().get(keycloakUserId);
        userResource.roles().realmLevel().add(List.of(roleRep));
    }
}