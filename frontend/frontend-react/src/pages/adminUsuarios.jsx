import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/adminUsuarios.css";
import { apiFetch, extraerMensaje } from "../api.js";

const API = "/api/v1/admin/clientes";

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [promoviendoId, setPromoviendoId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        const respuesta = await apiFetch(API, {
          credentials: "include",
        });

        if (!respuesta.ok) {
          throw new Error(
            respuesta.status === 401 || respuesta.status === 403
              ? "No tienes autorización para consultar los usuarios."
              : "No se pudieron cargar los usuarios."
          );
        }

        const datos = await respuesta.json();
        setUsuarios(Array.isArray(datos) ? datos : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    cargarUsuarios();
  }, []);

  // PROMOVER UN CLIENTE A ADMINISTRADOR
  async function promoverAdministrador(usuario) {
    setPromoviendoId(usuario.id);
    setMensaje("");
    setErrorAccion("");

    try {
      const respuesta = await apiFetch(
        `${API}/${usuario.id}/administrador`,
        { method: "PUT" }
      );

      if (!respuesta.ok) {
        const texto = await respuesta.text();
        throw new Error(
          extraerMensaje(texto) ||
            "No se pudo promover al usuario."
        );
      }

      const actualizado = await respuesta.json();

      setUsuarios((anteriores) =>
        anteriores.map((u) =>
          u.id === usuario.id ? { ...u, ...actualizado } : u
        )
      );

      setMensaje(
        `${usuario.nombreCompleto} ahora es administrador.`
      );
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setPromoviendoId(null);
      setConfirmandoId(null);
    }
  }

  const filtrados = usuarios.filter((usuario) => {
    const texto = `${usuario.nombreCompleto || ""} ${
      usuario.email || ""
    } ${usuario.rol || ""}`.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const administradores = usuarios.filter(
    (usuario) => usuario.rol === "ADMIN"
  ).length;

  return (
    <main className="admin-usuarios">
      <div className="usuarios-encabezado">
        <div>
          <span className="usuarios-etiqueta">
            FACTURE SNEAKERS
          </span>
          <h1>Gestión de usuarios</h1>
          <p>Consulta las cuentas registradas y promueve clientes a administrador.</p>
        </div>

        <Link to="/admin" className="usuarios-volver">
          ← Volver al panel
        </Link>
      </div>

      <div className="usuarios-resumen">
        <div className="usuarios-tarjeta">
          <span>Usuarios registrados</span>
          <strong>{usuarios.length}</strong>
        </div>

        <div className="usuarios-tarjeta">
          <span>Administradores</span>
          <strong>{administradores}</strong>
        </div>

        <div className="usuarios-tarjeta">
          <span>Clientes</span>
          <strong>{usuarios.length - administradores}</strong>
        </div>
      </div>

      <div className="usuarios-buscador">
        <input
          type="text"
          placeholder="Buscar por nombre, correo o rol..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {error && <p className="usuarios-error">{error}</p>}

      {errorAccion && (
        <p className="usuarios-error" role="alert">
          {errorAccion}
        </p>
      )}

      {mensaje && (
        <p className="usuarios-exito" role="status">
          {mensaje}
        </p>
      )}

      {cargando ? (
        <p>Cargando usuarios...</p>
      ) : !error && filtrados.length === 0 ? (
        <div className="usuarios-vacio">
          No se encontraron usuarios.
        </div>
      ) : !error ? (
        <div className="usuarios-tabla-contenedor">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Comuna</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((usuario) => (
                <tr key={usuario.id}>
                  <td>#{usuario.id}</td>
                  <td>{usuario.nombreCompleto}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.comuna || "No indicada"}</td>
                  <td>
                    <span
                      className={`usuario-rol ${
                        usuario.rol === "ADMIN"
                          ? "rol-admin"
                          : "rol-cliente"
                      }`}
                    >
                      {usuario.rol}
                    </span>
                  </td>
                  <td>
                    {usuario.rol === "ADMIN" ? (
                      <span className="usuarios-sin-accion">—</span>
                    ) : confirmandoId === usuario.id ? (
                      <div className="usuarios-acciones">
                        <button
                          type="button"
                          className="usuarios-boton usuarios-boton-confirmar"
                          disabled={promoviendoId === usuario.id}
                          onClick={() => promoverAdministrador(usuario)}
                        >
                          {promoviendoId === usuario.id
                            ? "PROMOVIENDO..."
                            : "SÍ, PROMOVER"}
                        </button>
                        <button
                          type="button"
                          className="usuarios-boton usuarios-boton-cancelar"
                          disabled={promoviendoId === usuario.id}
                          onClick={() => setConfirmandoId(null)}
                        >
                          CANCELAR
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="usuarios-boton"
                        onClick={() => {
                          setConfirmandoId(usuario.id);
                          setMensaje("");
                          setErrorAccion("");
                        }}
                      >
                        HACER ADMIN
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}