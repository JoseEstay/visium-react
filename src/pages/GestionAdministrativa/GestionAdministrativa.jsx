import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { fechaDeInstant, horaDeInstant, nombreCompleto } from "../../utils/formato";
import "./GestionAdministrativa.css";

const TITULOS = {
  usuarios: "Usuarios",
  administradores: "Administradores de sucursal",
  profesionales: "Profesionales",
  recepcionistas: "Recepcionistas",
  sucursales: "Sucursales",
  empresas: "Empresas",
  citas: "Citas",
  pacientes: "Pacientes y recetas",
};

const ROLES_ADMIN_GLOBAL = ["SUPER_ADMIN", "JEFE"];
const ROLES_ADMIN_SUCURSAL = ["JEFE_SUCURSAL", "RECEPCIONISTA"];
const ROLES_ADMINISTRADORES = ["JEFE", "JEFE_SUCURSAL"];

const esAdminGlobal = (roles) => roles.some((rol) => ROLES_ADMIN_GLOBAL.includes(rol));

const endpointDe = (resource) => {
  if (resource === "citas") {
    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 30);
    const hasta = new Date(hoy);
    hasta.setDate(hoy.getDate() + 60);
    return `/citas?desde=${fechaDeInstant(desde.toISOString())}&hasta=${fechaDeInstant(hasta.toISOString())}`;
  }
  if (resource === "pacientes") return "/pacientes?page=0&size=200";
  if (resource === "empresas") return "/empresas";
  return `/${resource}`;
};

const filasPorRecurso = {
  usuarios: (r) => ({
    id: r.id,
    celdas: [
      nombreCompleto(r),
      r.email || "—",
      (r.roles || []).join(", ") || "—",
      (r.sucursalIds || []).length ? `${r.sucursalIds.length} sucursal(es)` : "Sin sucursal",
    ],
  }),
  administradores: (r) => filasPorRecurso.usuarios(r),
  profesionales: (r) => ({
    id: r.id,
    celdas: [
      nombreCompleto(r),
      r.especialidad || "—",
      r.email || "—",
      (r.sucursalIds || []).length ? `${r.sucursalIds.length} sucursal(es)` : "Sin sucursal",
    ],
  }),
  recepcionistas: (r) => ({
    id: r.id,
    celdas: [
      nombreCompleto(r),
      r.email || "—",
      r.run || "—",
      r.telefono || "—",
      (r.sucursalIds || []).length ? `${r.sucursalIds.length} sucursal(es)` : "Sin sucursal",
    ],
  }),
  sucursales: (r) => ({
    id: r.id,
    celdas: [r.nombre, r.comuna || "—", r.ciudad || "—", r.direccion || "—", r.telefono || "—"],
  }),
  empresas: (r) => ({
    id: r.id,
    celdas: [r.razonSocial, r.rut || "—", r.email || "—", r.activo ? "Sí" : "No"],
  }),
  citas: (r) => ({
    id: r.id,
    celdas: [
      nombreCompleto(r),
      r.sucursalNombre || "—",
      r.fechaHoraInicio
        ? `${fechaDeInstant(r.fechaHoraInicio)} ${horaDeInstant(r.fechaHoraInicio)}`
        : "—",
      r.estado || "—",
      r.motivo || "—",
    ],
  }),
  pacientes: (r) => ({
    id: r.id,
    celdas: [
      nombreCompleto(r),
      r.numeroDocumento || "—",
      r.telefono || "—",
      r.email || "—",
      r.activo ? "Activo" : "Inactivo",
    ],
  }),
};

const columnasPorRecurso = {
  usuarios: ["Nombre", "Email", "Roles", "Sucursales"],
  administradores: ["Nombre", "Email", "Roles", "Sucursales"],
  profesionales: ["Nombre", "Especialidad", "Email", "Sucursales"],
  recepcionistas: ["Nombre", "Email", "RUN", "Teléfono", "Sucursales"],
  sucursales: ["Nombre", "Comuna", "Ciudad", "Dirección", "Teléfono"],
  empresas: ["Razón social", "RUT", "Email", "Activa"],
  citas: ["Paciente", "Sucursal", "Fecha y hora", "Estado", "Motivo"],
  pacientes: ["Nombre", "Documento", "Teléfono", "Email", "Estado"],
};

export default function GestionAdministrativa() {
  const { resource = "" } = useParams();
  const config = TITULOS[resource];
  const user = JSON.parse(localStorage.getItem("usuarioActual") || "null");
  const rolesUsuario = Array.isArray(user?.roles) ? user.roles : [];
  const puedeVer = esAdminGlobal(rolesUsuario)
    ? Boolean(config)
    : Boolean(config) && ROLES_ADMIN_SUCURSAL.some((rol) => rolesUsuario.includes(rol))
      ? resource !== "empresas"
      : false;

  if (!puedeVer) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PaginaRecurso key={resource} resource={resource} titulo={config} />;
}

function PaginaRecurso({ resource, titulo }) {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    apiFetch(endpointDe(resource))
      .then((datos) => {
        const lista = Array.isArray(datos)
          ? datos
          : Array.isArray(datos?.content)
            ? datos.content
            : [];
        let filtrada = lista;
        if (resource === "administradores") {
          filtrada = lista.filter((item) =>
            (item.roles || []).some((rol) => ROLES_ADMINISTRADORES.includes(rol)),
          );
        }
        setRecords(filtrada);
      })
      .catch((errorFetch) => setError(errorFetch.message || "No se pudo cargar la información."))
      .finally(() => setCargando(false));
  }, [resource]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [resource]);

  const filtered = useMemo(() => {
    const texto = query.trim().toLowerCase();
    if (!texto) return records;
    return records.filter((record) =>
      filasPorRecurso[resource](record).celdas.some((celda) =>
        String(celda).toLowerCase().includes(texto),
      ),
    );
  }, [records, query, resource]);

  const confirmarEliminacion = async () => {
    if (!recordToDelete) return;
    setEliminando(true);
    setError("");
    try {
      await apiFetch(`/pacientes/${recordToDelete.id}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
      setRecordToDelete(null);
    } catch (errorDelete) {
      setError(errorDelete.message || "No se pudo eliminar el paciente.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <h1>Gestión Administrativa</h1>
          <p>{titulo}: consulta los registros de la empresa activa.</p>
        </div>
        {resource === "pacientes" && (
          <button onClick={() => navigate("/paciente")}>
            <i className="bi bi-plus-lg" /> Agregar paciente
          </button>
        )}
      </div>

      <input
        className="admin-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Buscar ${titulo.toLowerCase()}...`}
      />

      {error && <p className="delete-error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {columnasPorRecurso[resource].map((columna) => (
                <th key={columna}>{columna}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={columnasPorRecurso[resource].length + 1}>Cargando...</td>
              </tr>
            ) : filtered.length ? (
              filtered.map((record) => {
                const fila = filasPorRecurso[resource](record);
                return (
                  <tr key={fila.id}>
                    {fila.celdas.map((celda, indice) => (
                      <td key={indice} data-label={columnasPorRecurso[resource][indice]}>
                        {celda}
                      </td>
                    ))}
                    <td data-label="Acciones">
                      {resource === "pacientes" && (
                        <button
                          className="icon-action"
                          onClick={() => navigate(`/recetas/historial/${record.id}`)}
                          aria-label="Ver historial de recetas"
                          title="Ver historial de recetas"
                        >
                          <i className="bi bi-clock-history" />
                        </button>
                      )}
                      {resource === "pacientes" && (
                        <button
                          className="icon-action"
                          onClick={() => navigate(`/paciente/${record.id}`)}
                          aria-label="Editar"
                          title="Editar"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                      )}
                      {resource === "pacientes" && (
                        <button
                          className="icon-action danger"
                          onClick={() => setRecordToDelete(record)}
                          aria-label="Eliminar"
                          title="Eliminar"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columnasPorRecurso[resource].length + 1}>
                  No hay registros para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {recordToDelete && (
        <div className="admin-modal" onClick={() => setRecordToDelete(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              confirmarEliminacion();
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-title">
              <h2>Eliminar paciente</h2>
              <button type="button" onClick={() => setRecordToDelete(null)}>
                &times;
              </button>
            </div>
            <p>
              ¿Eliminar a {nombreCompleto(recordToDelete)}? Esta acción lo desactiva
              en el sistema.
            </p>
            <button className="danger-save" type="submit" disabled={eliminando}>
              {eliminando ? "Eliminando..." : "Eliminar"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
