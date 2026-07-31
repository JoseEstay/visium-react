import "./HeaderMenu.css";
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const normalizarTexto = (valor = "") => valor
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

const normalizarRut = (rut = "") => rut.replace(/[^0-9kK]/g, "").toLowerCase();

export default function HeaderMenu() {

  const navigate= useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const usuario = JSON.parse(localStorage.getItem("usuarioActual") || "null");

  useEffect(() => {
    let activo = true;

    fetch("/data/pacientes.json")
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        if (activo) setPacientes(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (activo) setPacientes([]);
      });

    return () => { activo = false; };
  }, []);

  const coincidencias = useMemo(() => {
    const texto = normalizarTexto(busqueda);
    const rut = normalizarRut(busqueda);
    if (!texto) return [];

    return pacientes
      .filter((paciente) => normalizarTexto(paciente.nombre).includes(texto) || (rut && normalizarRut(paciente.rut).includes(rut)))
      .slice(0, 6);
  }, [busqueda, pacientes]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/Dashboard"); // límite seguro
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
              placeholder="Buscar paciente o RUT..."
              autoComplete="off"
              aria-label="Buscar paciente por nombre o RUT"
              aria-expanded={coincidencias.length > 0}
            />
          </div>
          {coincidencias.length > 0 && (
            <ul className="patient-results" role="listbox" aria-label="Pacientes encontrados">
              {coincidencias.map((paciente) => (
                <li key={paciente.rut}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setBusqueda("");
                      navigate(`/paciente/${paciente.rut}`);
                    }}
                  >
                    <img src={paciente.foto} alt="" />
                    <span>
                      <strong>{paciente.nombre}</strong>
                      <small>{paciente.rut}</small>
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
        <button className="btn-primary" onClick={() => navigate('/paciente')}>
          <i className="bi bi-person-fill-add"></i> 
          <span className="btn-text">Nuevo Paciente</span>
        </button>

        <button className="icon-btn theme-toggle" aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} onClick={toggleTheme}>
          <i key={theme} className={`bi theme-toggle-icon ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`} aria-hidden="true"></i>
        </button>
       
        <div className="profile">
          <img src="https://i.pravatar.cc/100?img=12" alt="Usuario" />
          <span>{usuario?.nombre || "Usuario"}</span>
        </div>
      </div>
    </header>
  );
}
