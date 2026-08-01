import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

export default function Contacto() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");

  return <div className={`login-page ${theme === "dark" ? "login-dark" : ""}`}><div className="auth-card reset-card"><div className="panel-right"><button className="login-theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}><i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`} /></button><div className="logo-row"><i className="bi bi-headset" /><span>Soporte Visium</span></div><h1 className="form-heading">Contáctanos</h1><p className="form-subheading">Cuéntanos cómo podemos ayudarte y el equipo de soporte se pondrá en contacto contigo.</p><form className="w-100" onSubmit={(event) => event.preventDefault()}><label className="form-label-custom mb-2">Correo electrónico</label><input className="form-control reset-input mb-3" type="email" placeholder="correo@ejemplo.cl" required /><label className="form-label-custom mb-2">Número de teléfono</label><input className="form-control reset-input mb-3" type="tel" placeholder="+56 9 1234 5678" required /><label className="form-label-custom mb-2">Motivo de contacto</label><textarea className="form-control contact-message mb-3" placeholder="Describe tu consulta o inconveniente..." required /><button className="btn btn-primary btn-login w-100 text-white" type="submit">Enviar solicitud</button></form><Link className="reset-back" to="/login">Volver al inicio de sesión</Link></div></div></div>;
}
