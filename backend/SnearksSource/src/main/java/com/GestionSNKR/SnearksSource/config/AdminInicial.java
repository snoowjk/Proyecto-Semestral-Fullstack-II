package com.GestionSNKR.SnearksSource.config;

import com.GestionSNKR.SnearksSource.model.Cliente;
import com.GestionSNKR.SnearksSource.model.Rol;
import com.GestionSNKR.SnearksSource.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Crea una cuenta de administrador al iniciar el backend, si todavía no existe.
 *
 * Así el sistema siempre tiene un ADMIN disponible, aunque la base de datos
 * sea nueva. Si la cuenta ya existe, no se modifica.
 *
 * El correo y la contraseña se pueden cambiar con las variables de entorno
 * APP_ADMIN_EMAIL y APP_ADMIN_PASSWORD. La contraseña se guarda cifrada con BCrypt.
 */
@Configuration
public class AdminInicial {

    @Bean
    CommandLineRunner crearAdminInicial(
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:admin@facture.cl}") String email,
            @Value("${app.admin.password:Admin123}") String password) {

        return args -> {
            if (clienteRepository.findByEmail(email).isPresent()) {
                return;
            }

            Cliente admin = new Cliente();
            admin.setNombreCompleto("Administrador Facture");
            admin.setEmail(email);
            admin.setContrasena(passwordEncoder.encode(password));
            admin.setRol(Rol.ADMIN);

            clienteRepository.save(admin);
            System.out.println("Cuenta de administrador creada: " + email);
        };
    }
}