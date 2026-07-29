import { useState } from "react";
import { NavLink } from "react-router-dom";
import eyeLogo from "../../assets/logo-eye.svg";
import "./Menu.css";

const navigationItems = [
  { to: "/dashboard", icon: "bi-grid", label: "Panel de control" },
  { to: "/gestionPacientes", icon: "bi-people-fill", label: "Pacientes" },
  { to: "/citas", icon: "bi-calendar-event", label: "Citas" },
  // Métricas reutiliza temporalmente el dashboard, por lo que no debe duplicar su estado activo.
  { to: "/dashboard", icon: "bi-graph-up", label: "Métricas", matchActive: false, roles: ["administrador sucursales", "administrador sucursal", "jefe"] },
  { to: "/paciente", icon: "bi-file-earmark-text", label: "Ficha" },
];

export default function MenuLateral() {
  const [isOpen, setIsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("usuarioActual") || "null");
  const adminItems = ["administrador sucursales", "jefe"].includes(user?.rol)
    ? ["sucursales", "profesionales", "recepcionistas", "citas", "pacientes"]
    : user?.rol === "administrador sucursal"
      ? ["profesionales", "recepcionistas", "citas", "pacientes"]
      : [];

  const toggleMenu = () => setIsOpen((open) => !open);
  const closeMenu = () => setIsOpen(false);
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

        <div className="logo-icon">
          <img src={eyeLogo} alt="" aria-hidden="true" />
        </div>
        <div>
          <h2>Visium</h2>
          <span>Software de Gestión Óptica</span>
        </div>


      </div>

      <nav className="menu">
        {navigationItems.filter((item) => !item.roles || item.roles.includes(user?.rol)).map(({ to, icon, label, matchActive = true }) => (
          <NavLink
            key={label}
            to={to}
            className={navigationClassName(matchActive)}
            onClick={closeMenu}
          >
            <i className={`bi ${icon}`}></i>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
        {adminItems.length > 0 && <div className="admin-navigation">
          <button type="button" className="admin-toggle" onClick={() => setAdminOpen((open) => !open)} aria-expanded={adminOpen}>
            <i className="bi bi-gear-fill" /><span className="nav-label">Gestión Administrativa</span><i className={`bi bi-chevron-${adminOpen ? "up" : "down"} admin-chevron`} />
          </button>
          {adminOpen && <div className="admin-submenu">
            {adminItems.map((item) => <NavLink key={item} to={`/gestion-administrativa/${item}`} onClick={closeMenu}><i className="bi bi-chevron-right" /><span className="nav-label">{item === "pacientes" ? "Pacientes y recetas" : item.charAt(0).toUpperCase() + item.slice(1)}</span></NavLink>)}
            <NavLink to="/gestion-administrativa/contrasenas" onClick={closeMenu}><i className="bi bi-key" /><span className="nav-label">Contraseñas</span></NavLink>
          </div>}
        </div>}
      </nav>

      <div className="sidebar-bottom">
        <NavLink className={navigationClassName(true)} to="/login" onClick={closeMenu}>
          <i className="bi bi-box-arrow-right"></i>
          <span className="nav-label">Cerrar Sesión</span>
        </NavLink>
      </div>
    </aside>
  );
}
