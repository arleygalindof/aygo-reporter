package com.dashboard.auth.service;

import com.dashboard.auth.dto.Auth0TokenResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class Auth0Service {

    private final RestTemplate restTemplate;

    @Value("${auth0.domain}")
    private String auth0Domain;

    @Value("${auth0.clientId}")
    private String clientId;

    @Value("${auth0.clientSecret}")
    private String clientSecret;

    @Value("${auth0.audience}")
    private String audience;

    public Auth0TokenResponse exchangeCodeForToken(String code, String redirectUri) {
        try {
            String tokenUrl = "https://" + auth0Domain + "/oauth/token";

            Map<String, String> body = new HashMap<>();
            body.put("grant_type", "authorization_code");
            body.put("client_id", clientId);
            body.put("client_secret", clientSecret);
            body.put("code", code);
            body.put("redirect_uri", redirectUri);
            body.put("audience", audience);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            Auth0TokenResponse response = restTemplate.postForObject(
                    tokenUrl,
                    request,
                    Auth0TokenResponse.class
            );

            log.info("Token obtenido exitosamente de Auth0");
            return response;

        } catch (Exception e) {
            log.error("Error al intercambiar código por token: {}", e.getMessage());
            throw new RuntimeException("No se pudo obtener el token de Auth0", e);
        }
    }
}
