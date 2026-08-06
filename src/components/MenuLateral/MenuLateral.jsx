import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import eyeLogo from "../../assets/logo-eye.svg";
import "./Menu.css";

const navigationItems = [
  { to: "/dashboard", icon: "bi-grid", label: "Panel de control" },
  { to: "/gestionPacientes", icon: "bi-people-fill", label: "Pacientes" },
  { to: "/citas", icon: "bi-calendar-event", label: "Citas" },
  // Métricas reutiliza temporalmente el dashboard, por lo que no debe duplicar su estado activo.
  { to: "/dashboard", icon: "bi-graph-up", label: "Métricas", matchActive: false, roles: ["JEFE", "JEFE_SUCURSAL", "SUPER_ADMIN"] },
  { to: "/paciente", icon: "bi-file-earmark-text", label: "Ficha" },
];

const ROLES_ALTA_GESTION = ["JEFE", "SUPER_ADMIN"];
const ROLES_GESTION_SUCURSAL = ["JEFE_SUCURSAL"];

export default function MenuLateral() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [isDevelopmentModalOpen, setIsDevelopmentModalOpen] = useState(false);
  const [metricsVisible, setMetricsVisible] = useState(false);
  const metricsClickCount = useRef(0);
  const metricsClickTimer = useRef(null);
  const user = JSON.parse(localStorage.getItem("usuarioActual") || "null");
  const userRoles = user?.roles || [];
  const canUnlockMetrics = [...ROLES_ALTA_GESTION, ...ROLES_GESTION_SUCURSAL].some((rol) => userRoles.includes(rol));
  const adminItems = ROLES_ALTA_GESTION.some((rol) => userRoles.includes(rol))
    ? ["usuarios", "sucursales", "profesionales", "recepcionistas", "citas", "pacientes"]
    : ROLES_GESTION_SUCURSAL.some((rol) => userRoles.includes(rol))
      ? ["profesionales", "recepcionistas", "citas", "pacientes"]
      : [];

  const toggleMenu = () => setIsOpen((open) => !open);
  const closeMenu = () => setIsOpen(false);
  const handleLogout = (event) => {
    event.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("sesionIniciada");
    localStorage.removeItem("usuarioActual");
    localStorage.removeItem("empresaActivaId");
    closeMenu();
    navigate("/login", { replace: true });
  };
  const openDevelopmentModal = () => {
    closeMenu();
    setIsDevelopmentModalOpen(true);
  };
  const unlockMetrics = () => {
    if (canUnlockMetrics) setMetricsVisible(true);
  };
  const handleMetricsClick = () => {
    metricsClickCount.current += 1;
    window.clearTimeout(metricsClickTimer.current);

    if (metricsClickCount.current === 3) {
      setMetricsVisible(false);
      setIsDevelopmentModalOpen(false);
      metricsClickCount.current = 0;
      return;
    }

    metricsClickTimer.current = window.setTimeout(() => {
      if (metricsClickCount.current === 1) openDevelopmentModal();
      metricsClickCount.current = 0;
    }, 550);
  };

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsDevelopmentModalOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => () => window.clearTimeout(metricsClickTimer.current), []);

  const navigationClassName = (matchActive) => ({ isActive }) =>
    `nav-link${isActive && matchActive ? " active" : ""}`;

  return (
    <aside className={`sidebar ${isOpen ? "is-open" : ""}`}>
      <div className="logo">

        <button
          className="sidebar-toggle"
          type="button"
          onClick={toggleMenu}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isOpen}
        >
          <i className="bi bi-list sidebar-toggle-menu-icon" aria-hidden="true"></i>
          <img
            className="sidebar-toggle-logo"
            src={eyeLogo}
            alt=""
            aria-hidden="true"
          />
        </button>

        <div className="logo-icon" onDoubleClick={unlockMetrics}>
          <img src={eyeLogo} alt="" aria-hidden="true" />
        </div>
        <div>
          <h2>Visium</h2>
          <span>Software de Gestión Óptica</span>
        </div>


      </div>

      <nav className="menu">
        {navigationItems.filter((item) => {
          if (item.label === "Métricas") return metricsVisible && item.roles.includes(user?.rol);
          return !item.roles || item.roles.includes(user?.rol);
        }).map(({ to, icon, label, matchActive = true }) => (
          label === "Métricas" ? (
            <button key={label} type="button" className="nav-link nav-link-button" onClick={handleMetricsClick}>
              <i className={`bi ${icon}`}></i>
              <span className="nav-label">{label}</span>
            </button>
          ) : (
            <NavLink
              key={label}
              to={to}
              className={navigationClassName(matchActive)}
              onClick={closeMenu}
            >
              <i className={`bi ${icon}`}></i>
              <span className="nav-label">{label}</span>
            </NavLink>
          )
        ))}
        {adminItems.length > 0 && <div className="admin-navigation">
          <button type="button" className="admin-toggle" onClick={() => setAdminOpen((open) => !open)} aria-expanded={adminOpen}>
            <i className="bi bi-gear-fill" /><span className="nav-label">Gestión Administrativa</span><i className={`bi bi-chevron-${adminOpen ? "up" : "down"} admin-chevron`} />
          </button>
          {adminOpen && <div className="admin-submenu">
            {adminItems.map((item) => <NavLink key={item} to={`/gestion-administrativa/${item}`} onClick={closeMenu}><i className="bi bi-chevron-right" /><span className="nav-label">{item === "pacientes" ? "Pacientes y recetas" : item === "administradores" ? "Administradores de sucursal" : item.charAt(0).toUpperCase() + item.slice(1)}</span></NavLink>)}
            <NavLink to="/gestion-administrativa/contrasenas" onClick={closeMenu}><i className="bi bi-key" /><span className="nav-label">Contraseñas</span></NavLink>
          </div>}
        </div>}
      </nav>

      <div className="sidebar-bottom">
        <NavLink className={navigationClassName(true)} to="/login" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          <span className="nav-label">Cerrar Sesión</span>
        </NavLink>
      </div>

      {isDevelopmentModalOpen && (
        <div className="development-modal-backdrop" role="presentation" onMouseDown={() => setIsDevelopmentModalOpen(false)}>
          <section className="development-modal" role="dialog" aria-modal="true" aria-labelledby="development-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <i className="bi bi-tools development-modal-icon" aria-hidden="true"></i>
            <h2 id="development-modal-title">Sección en desarrollo</h2>
            <p>Estamos preparando las métricas para entregarte una mejor experiencia.</p>
            <button type="button" onClick={() => setIsDevelopmentModalOpen(false)}>Entendido</button>
          </section>
        </div>
      )}
    </aside>
  );
}
