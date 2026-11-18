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
 * Crea las cuentas de administrador y de vendedor al iniciar el backend,
 * si todavía no existen.
 *
 * Así el sistema siempre tiene un ADMIN y un VENDEDOR disponibles, aunque la
 * base de datos sea nueva. Si una cuenta ya existe, no se modifica.
 *
 * Los correos y contraseñas se pueden cambiar con las variables de entorno
 * APP_ADMIN_EMAIL, APP_ADMIN_PASSWORD, APP_VENDEDOR_EMAIL y
 * APP_VENDEDOR_PASSWORD. Las contraseñas se guardan cifradas con BCrypt.
 */
@Configuration
public class AdminInicial {

    @Bean
    CommandLineRunner crearCuentasIniciales(
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:admin@facture.cl}") String adminEmail,
            @Value("${app.admin.password:Admin123}") String adminPassword,
            @Value("${app.vendedor.email:vendedor@facture.cl}") String vendedorEmail,
            @Value("${app.vendedor.password:Vendedor123}") String vendedorPassword) {

        return args -> {
            crearSiNoExiste(clienteRepository, passwordEncoder,
                    "Administrador Facture", adminEmail, adminPassword, Rol.ADMIN);

            crearSiNoExiste(clienteRepository, passwordEncoder,
                    "Vendedor Facture", vendedorEmail, vendedorPassword, Rol.VENDEDOR);
        };
    }

    private void crearSiNoExiste(
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder,
            String nombre,
            String email,
            String password,
            Rol rol) {

        if (clienteRepository.findByEmail(email).isPresent()) {
            return;
        }

        Cliente cuenta = new Cliente();
        cuenta.setNombreCompleto(nombre);
        cuenta.setEmail(email);
        cuenta.setContrasena(passwordEncoder.encode(password));
        cuenta.setRol(rol);

        clienteRepository.save(cuenta);
        System.out.println("Cuenta " + rol + " creada: " + email);
    }
}
