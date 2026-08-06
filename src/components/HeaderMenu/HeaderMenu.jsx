import "./HeaderMenu.css";
import { useTheme } from "../../context/useTheme";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";
import { nombreCompleto } from "../../utils/formato";

export default function HeaderMenu() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const usuario = JSON.parse(localStorage.getItem("usuarioActual") || "null");

  useEffect(() => {
    let activo = true;
    const texto = busqueda.trim();
    if (!texto) {
      return undefined;
    }
    const control = new AbortController();
    const espera = setTimeout(() => {
      apiFetch(`/pacientes?page=0&size=6&texto=${encodeURIComponent(texto)}`, {
        signal: control.signal,
      })
        .then((datos) => {
          if (activo) {
            setPacientes(Array.isArray(datos?.content) ? datos.content : []);
          }
        })
        .catch(() => {
          if (activo) setPacientes([]);
        });
    }, 300);
    return () => {
      activo = false;
      clearTimeout(espera);
      control.abort();
    };
  }, [busqueda]);

  const coincidencias = useMemo(() => (busqueda.trim() ? pacientes : []), [busqueda, pacientes]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      {/* 1. Botón Volver */}
      <div className="topbar-left">
        <button className="back-btn" aria-label="Volver" onClick={handleBack}>
          <i className="bi bi-arrow-left"></i>
        </button>
      </div>

      {/* 2. Buscador / Input (Izquierda-Centro) */}
      <div className="topbar-center">
        <div className="search-wrapper">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              id="searchPatient"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar paciente o documento..."
              autoComplete="off"
              aria-label="Buscar paciente por nombre o documento"
              aria-expanded={coincidencias.length > 0}
            />
          </div>
          {coincidencias.length > 0 && (
            <ul className="patient-results" role="listbox" aria-label="Pacientes encontrados">
              {coincidencias.map((paciente) => (
                <li key={paciente.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setBusqueda("");
                      navigate(`/paciente/${paciente.id}`);
                    }}
                  >
                    <i className="bi bi-person-circle"></i>
                    <span>
                      <strong>{nombreCompleto(paciente)}</strong>
                      <small>{paciente.numeroDocumento}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 3. Acciones a la Derecha (Nuevo Paciente, Campana, Perfil) */}
      <div className="topbar-right">
        <button className="btn-primary" onClick={() => navigate("/paciente")}>
          <i className="bi bi-person-fill-add"></i>
          <span className="btn-text">Nuevo Paciente</span>
        </button>

        <button
          className="icon-btn theme-toggle"
          aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          onClick={toggleTheme}
        >
          <i
            key={theme}
            className={`bi theme-toggle-icon ${theme === "dark" ? "bi-sun-fill" : "bi-moon-stars-fill"}`}
            aria-hidden="true"
          ></i>
        </button>

        <div className="profile">
          <img src="https://i.pravatar.cc/100?img=12" alt="Usuario" />
          <span>{usuario?.nombre || "Usuario"}</span>
        </div>
      </div>
    </header>
  );
}
