import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/adminUsuarios.css";
import { apiFetch, extraerMensaje } from "../api.js";

const API = "/api/v1/admin/clientes";

// Cambios de rol que puede hacer el administrador
const ACCIONES = {
  administrador: {
    boton: "HACER ADMIN",
    confirmar: "SÍ, HACER ADMIN",
    ruta: "administrador",
    resultado: "ahora es administrador",
  },
  vendedor: {
    boton: "HACER VENDEDOR",
    confirmar: "SÍ, HACER VENDEDOR",
    ruta: "vendedor",
    resultado: "ahora es vendedor",
  },
};

// Qué acciones se ofrecen según el rol actual del usuario
function accionesDisponibles(rol) {
  if (rol === "CLIENTE") return ["administrador", "vendedor"];
  if (rol === "VENDEDOR") return ["administrador"];
  return [];
}

function claseRol(rol) {
  if (rol === "ADMIN") return "rol-admin";
  if (rol === "VENDEDOR") return "rol-vendedor";
  return "rol-cliente";
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  // { id, accion } del cambio que se está confirmando
  const [confirmando, setConfirmando] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);
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

  // CAMBIAR EL ROL DE UN USUARIO (a administrador o a vendedor)
  async function cambiarRol(usuario, accion) {
    const datosAccion = ACCIONES[accion];

    setProcesandoId(usuario.id);
    setMensaje("");
    setErrorAccion("");

    try {
      const respuesta = await apiFetch(
        `${API}/${usuario.id}/${datosAccion.ruta}`,
        { method: "PUT" }
      );

      if (!respuesta.ok) {
        const texto = await respuesta.text();
        throw new Error(
          extraerMensaje(texto) ||
            "No se pudo cambiar el rol del usuario."
        );
      }

      const actualizado = await respuesta.json();

      setUsuarios((anteriores) =>
        anteriores.map((u) =>
          u.id === usuario.id ? { ...u, ...actualizado } : u
        )
      );

      setMensaje(
        `${usuario.nombreCompleto} ${datosAccion.resultado}.`
      );
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setProcesandoId(null);
      setConfirmando(null);
    }
  }

  const filtrados = usuarios.filter((usuario) => {
    const texto = `${usuario.nombreCompleto || ""} ${
      usuario.email || ""
    } ${usuario.rol || ""}`.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const contar = (rol) =>
    usuarios.filter((usuario) => usuario.rol === rol).length;

  return (
    <main className="admin-usuarios">
      <div className="usuarios-encabezado">
        <div>
          <span className="usuarios-etiqueta">
            FACTURE SNEAKERS
          </span>
          <h1>Gestión de usuarios</h1>
          <p>
            Consulta las cuentas registradas y asigna los roles de
            administrador y vendedor.
          </p>
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
          <strong>{contar("ADMIN")}</strong>
        </div>

        <div className="usuarios-tarjeta">
          <span>Vendedores</span>
          <strong>{contar("VENDEDOR")}</strong>
        </div>

        <div className="usuarios-tarjeta">
          <span>Clientes</span>
          <strong>{contar("CLIENTE")}</strong>
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
              {filtrados.map((usuario) => {
                const acciones = accionesDisponibles(usuario.rol);
                const enConfirmacion =
                  confirmando?.id === usuario.id ? confirmando : null;
                const procesando = procesandoId === usuario.id;

                return (
                  <tr key={usuario.id}>
                    <td>#{usuario.id}</td>
                    <td>{usuario.nombreCompleto}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.comuna || "No indicada"}</td>
                    <td>
                      <span
                        className={`usuario-rol ${claseRol(usuario.rol)}`}
                      >
                        {usuario.rol}
                      </span>
                    </td>
                    <td>
                      {acciones.length === 0 ? (
                        <span className="usuarios-sin-accion">—</span>
                      ) : enConfirmacion ? (
                        <div className="usuarios-acciones">
                          <button
                            type="button"
                            className="usuarios-boton usuarios-boton-confirmar"
                            disabled={procesando}
                            onClick={() =>
                              cambiarRol(usuario, enConfirmacion.accion)
                            }
                          >
                            {procesando
                              ? "GUARDANDO..."
                              : ACCIONES[enConfirmacion.accion].confirmar}
                          </button>
                          <button
                            type="button"
                            className="usuarios-boton usuarios-boton-cancelar"
                            disabled={procesando}
                            onClick={() => setConfirmando(null)}
                          >
                            CANCELAR
                          </button>
                        </div>
                      ) : (
                        <div className="usuarios-acciones">
                          {acciones.map((accion) => (
                            <button
                              key={accion}
                              type="button"
                              className="usuarios-boton"
                              onClick={() => {
                                setConfirmando({ id: usuario.id, accion });
                                setMensaje("");
                                setErrorAccion("");
                              }}
                            >
                              {ACCIONES[accion].boton}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
