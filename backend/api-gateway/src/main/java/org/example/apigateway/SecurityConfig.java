package org.example.apigateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.HttpStatusServerEntryPoint;
import org.springframework.security.web.server.authorization.HttpStatusServerAccessDeniedHandler;

import java.util.Collection;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new HttpStatusServerEntryPoint(HttpStatus.UNAUTHORIZED))
                        .accessDeniedHandler(new HttpStatusServerAccessDeniedHandler(HttpStatus.FORBIDDEN)))
                .authorizeExchange(exchange -> exchange
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers(
                                "/api/auth/login",
                                "/api/auth/logout",
                                "/api/auth/refresh",
                                "/api/auth/register/courier",
                                "/api/auth/register/dispatcher",
                                "/actuator/**",
                                "/error"
                        ).permitAll()
                        .pathMatchers("/api/auth/profile").authenticated()
                        .pathMatchers("/vehicles/**", "/trips/**", "/deliveries/**", "/history/**", "/routing/**", "/test")
                        .hasAnyRole("ADMIN", "DISPATCHER", "COURIER")
                        .anyExchange().denyAll())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .authenticationEntryPoint(new HttpStatusServerEntryPoint(HttpStatus.UNAUTHORIZED))
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(reactiveJwtAuthenticationConverter())));

        return http.build();
    }

    @Bean
    public ReactiveJwtAuthenticationConverterAdapter reactiveJwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Object realmAccessClaim = jwt.getClaim("realm_access");
            if (!(realmAccessClaim instanceof java.util.Map<?, ?> realmAccess)) {
                return List.of();
            }

            Object rolesClaim = realmAccess.get("roles");
            if (!(rolesClaim instanceof Collection<?> roles)) {
                return List.of();
            }

            return roles.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role))
                    .toList();
        });

        return new ReactiveJwtAuthenticationConverterAdapter(converter);
    }
}
