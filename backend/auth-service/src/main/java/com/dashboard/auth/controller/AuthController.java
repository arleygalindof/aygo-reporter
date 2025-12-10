package com.dashboard.auth.controller;

import com.dashboard.auth.dto.LoginRequest;
import com.dashboard.auth.dto.LoginResponse;
import com.dashboard.auth.dto.RegisterRequest;
import com.dashboard.auth.model.User;
import com.dashboard.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("")
@Slf4j
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Endpoint de login: recibe email y password, devuelve JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        log.info("Intento de login para: {}", loginRequest.getEmail());
        
        try {
            // Buscar usuario por email
            var user = authService.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

            // Validar contraseña
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                log.warn("Contraseña incorrecta para: {}", loginRequest.getEmail());
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Credenciales inválidas"));
            }

            // Generar JWT token
            String token = authService.generateToken(user);
            
            // Construir nombre completo
            String fullName = user.getFirstName();
            if (user.getLastName() != null && !user.getLastName().isEmpty()) {
                fullName += " " + user.getLastName();
            }

            LoginResponse response = new LoginResponse(
                    token,
                    user.getEmail(),
                    fullName,
                    user.getId()
            );

            log.info("Login exitoso para: {}", loginRequest.getEmail());
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Error en login: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Credenciales inválidas"));
        } catch (Exception e) {
            log.error("Error inesperado en login: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Endpoint de registro: crea un nuevo usuario
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        log.info("Registro de nuevo usuario: {}", registerRequest.getEmail());
        
        try {
            // registerUser espera (email, password, firstName, lastName, auth0Id)
            // Para registro local, no tenemos auth0Id
            String firstName = registerRequest.getFirstName();
            String lastName = registerRequest.getLastName();

            // Si no vienen nombres, evita null para las columnas NOT NULL
            if (firstName == null || firstName.isBlank()) {
                firstName = registerRequest.getEmail();
            }
            if (lastName == null) {
                lastName = "";
            }

            User user = authService.registerUser(
                    registerRequest.getEmail(),
                    registerRequest.getPassword(),
                    firstName,
                    lastName,
                    ""  // auth0Id vacío para usuarios locales
            );

            // Generar JWT inmediatamente después del registro
            String token = authService.generateToken(user);

            LoginResponse response = new LoginResponse(
                    token,
                    user.getEmail(),
                    user.getFirstName(),
                    user.getId()
            );

            log.info("Registro exitoso para: {}", registerRequest.getEmail());
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Error en registro: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error inesperado en registro: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Endpoint para verificar token Auth0 (opcional, para integración futura)
     */
    @PostMapping("/verify-token")
    public ResponseEntity<?> verifyAuth0Token(@RequestBody Map<String, String> payload) {
        log.info("Verificando token de Auth0");
        
        String idToken = payload.get("idToken");
        String auth0Id = payload.get("auth0Id");
        String email = payload.get("email");
        
        try {
            // Buscar o crear usuario con Auth0Id
            var user = authService.findByAuth0Id(auth0Id)
                    .orElseGet(() -> {
                        log.info("Creando nuevo usuario desde Auth0: {}", auth0Id);
                        return authService.registerUser(
                                email,
                                "", // Sin contraseña local para usuarios Auth0
                                payload.getOrDefault("firstName", ""),
                                payload.getOrDefault("lastName", ""),
                                auth0Id
                        );
                    });

            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "firstName", user.getFirstName(),
                    "lastName", user.getLastName(),
                    "auth0Id", user.getAuth0Id(),
                    "message", "Token verificado"
            ));
        } catch (Exception e) {
            log.error("Error verificando token: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Token inválido"));
        }
    }

    /**
     * Endpoint para obtener datos del usuario
     */
    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        try {
            User user = authService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "Auth Service running"));
    }

}
