package com.GestionSNKR.SnearksSource.controller;

import com.GestionSNKR.SnearksSource.model.Boleta;
import com.GestionSNKR.SnearksSource.service.BoletaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Pedidos de todos los clientes.
 *
 *  - ADMIN: puede listar, ver el detalle y cambiar el estado.
 *  - VENDEDOR: solo puede listar y ver el detalle.
 */
@RestController
@RequestMapping("/api/v1/admin/boletas")
@PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
public class AdminBoletaController {

    private final BoletaService boletaService;

    public AdminBoletaController(BoletaService boletaService) {
        this.boletaService = boletaService;
    }

    @GetMapping
    public ResponseEntity<List<Boleta>> listarTodas() {
        return ResponseEntity.ok(boletaService.listarTodas());
    }

    @GetMapping("/{boletaId}")
    public ResponseEntity<?> obtenerDetalle(@PathVariable Long boletaId) {
        try {
            return ResponseEntity.ok(boletaService.obtenerPorId(boletaId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PutMapping("/{boletaId}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizarEstado(
            @PathVariable Long boletaId,
            @RequestBody Map<String, String> datos) {

        try {
            String nuevoEstado = datos.get("estado");

            Boleta actualizada = boletaService.actualizarEstado(
                    boletaId, nuevoEstado
            );

            return ResponseEntity.ok(actualizada);

        } catch (IllegalArgumentException e) {
            HttpStatus status = "Pedido no encontrado.".equals(e.getMessage())
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;

            return ResponseEntity.status(status)
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }
}
