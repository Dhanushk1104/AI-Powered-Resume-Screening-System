package com.visualflow.controller;

import com.visualflow.model.UserEntity;
import com.visualflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired
    private UserRepository userRepository;

    // In-memory admin for demo
    private static final Map<String, User> users = new HashMap<>();
    private static final Map<String, String> tokens = new HashMap<>(); // maps token -> email

    static {
        users.put("admin", new User("1234", "ADMIN"));
    }

    // Health check
    @GetMapping("/test")
    public ResponseEntity<?> test() {
        return ResponseEntity.ok(Map.of("message", "Backend is running ✅"));
    }

    // ====================== SIGNUP ======================
    @PostMapping("/auth/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "User already exists"));
        }

        UserEntity newUser = new UserEntity(email, password, "USER");
        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }

    // ====================== LOGIN ======================
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }

        // First check in-memory admin
        User admin = users.get(email);
        if (admin != null && admin.password.equals(password)) {
            String token = UUID.randomUUID().toString();
            tokens.put(token, email); // store email
            return ResponseEntity.ok(Map.of("token", token, "role", admin.role));
        }

        // Then check MySQL users
        var optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty() || !optionalUser.get().getPassword().equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }

        String token = UUID.randomUUID().toString();
        tokens.put(token, optionalUser.get().getEmail()); // store email

        return ResponseEntity.ok(Map.of("token", token, "role", optionalUser.get().getRole()));
    }

    // ====================== FETCH CURRENT USER ======================
    @GetMapping("/auth/me")
    public ResponseEntity<?> getMe(@RequestHeader(name = "Authorization", required = false) String auth) {
        if (auth == null || !tokens.containsKey(auth)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid token"));
        }

        String email = tokens.get(auth);
        Optional<UserEntity> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        UserEntity user = optionalUser.get();
        return ResponseEntity.ok(Map.of(
                "email", user.getEmail(),
                "role", user.getRole()
        ));
    }

    // ====================== UPDATE PROFILE ======================
    @PutMapping("/auth/update")
    public ResponseEntity<?> updateProfile(
            @RequestHeader(name = "Authorization", required = false) String auth,
            @RequestBody Map<String, String> body) {

        if (auth == null || !tokens.containsKey(auth)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid token"));
        }

        String emailFromToken = tokens.get(auth);
        Optional<UserEntity> optionalUser = userRepository.findByEmail(emailFromToken);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        UserEntity user = optionalUser.get();

        String newEmail = body.get("email");
        String newPassword = body.get("password");

        if (newEmail != null && !newEmail.isBlank()) user.setEmail(newEmail);
        if (newPassword != null && !newPassword.isBlank()) user.setPassword(newPassword);

        userRepository.save(user);

        // Update token map if email changed
        if (newEmail != null && !newEmail.isBlank()) {
            tokens.put(auth, newEmail);
        }

        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    // ====================== DELETE ACCOUNT ======================
    @DeleteMapping("/auth/delete")
    public ResponseEntity<?> deleteAccount(@RequestHeader(name = "Authorization", required = false) String auth) {
        if (auth == null || !tokens.containsKey(auth)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid token"));
        }

        String email = tokens.get(auth);
        Optional<UserEntity> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        userRepository.delete(optionalUser.get());
        tokens.remove(auth); // remove token

        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }

    // ====================== AI PROXY ======================
    @PostMapping("/ai/analyze")
    public ResponseEntity<?> analyze(
            @RequestHeader(name = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {

        if (auth == null || !tokens.containsKey(auth)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or invalid token"));
        }

        RestTemplate restTemplate = new RestTemplate();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response =
                    restTemplate.postForEntity("http://localhost:8000/analyze", request, Map.class);

            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AI service error: " + e.getMessage()));
        }
    }
    @GetMapping("/admin/users")
public List<Map<String, Object>> getAllUsers() {
    List<UserEntity> allUsers = userRepository.findAll();
    List<Map<String, Object>> result = new ArrayList<>();

    for (UserEntity u : allUsers) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", u.getId());
        userMap.put("email", u.getEmail());
        userMap.put("role", u.getRole());
        userMap.put("createdAt", u.getCreatedAt());
        result.add(userMap);
    }

    return result;
}

    // ====================== ADMIN INFO ======================
    @GetMapping("/admin/info")
    public ResponseEntity<?> adminInfo(
            @RequestHeader(name = "Authorization", required = false) String auth) {

        if (auth == null || !"ADMIN".equals(tokens.get(auth))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin only"));
        }

        return ResponseEntity.ok(Map.of("msg", "Confidential Admin Information 🔒"));
    }

    // ====================== Inner User Class ======================
    static class User {
        String password;
        String role;

        User(String password, String role) {
            this.password = password;
            this.role = role;
        }
    }
}

    



// ====================== GLOBAL CORS CONFIG ======================
@Configuration
class GlobalCorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowCredentials(true);
            }
        };
    }
}
