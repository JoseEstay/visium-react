import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../Login/Login.css";

const STORAGE_KEY = "visium.solicitudesDemo";

export default function SolicitudDemo() {
  const [form, setForm] = useState({ nombre: "", empresa: "", correo: "", telefono: "", cargo: "", sucursales: "", mensaje: "" });
  const [enviada, setEnviada] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const themeToggle = <button type="button" className="login-theme-toggle" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"} title={theme === "dark" ? "Modo claro" : "Modo oscuro"}><i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`} /></button>;

  const actualizarCampo = (event) => setForm((actual) => ({ ...actual, [event.target.name]: event.target.value }));

  const enviarSolicitud = async (event) => {
    event.preventDefault();
    let base;
    let guardadas;

    try { base = await fetch("/data/solicitudes-demo.json").then((response) => response.ok ? response.json() : []); } catch { base = []; }
    try { guardadas = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { guardadas = []; }

    const solicitud = {
      id: `DEMO-${Date.now()}`,
      ...form,
      sucursales: Number(form.sucursales),
      fechaSolicitud: new Date().toISOString(),
      estado: "Pendiente"
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...(Array.isArray(base) ? base : []), ...(Array.isArray(guardadas) ? guardadas : []), solicitud]));
    setEnviada(true);
  };

  if (enviada) {
    return <div className={`login-page ${theme === "dark" ? "login-dark" : ""}`}><div className="auth-card reset-card"><div className="panel-right">{themeToggle}<div className="logo-row"><i className="bi bi-check-circle-fill" /><span>Solicitud recibida</span></div><h1 className="form-heading">Gracias, {form.nombre}</h1><p className="form-subheading">Registramos tu solicitud de demostración. Te contactaremos mediante {form.correo}.</p><Link className="btn btn-primary btn-login w-100 text-white text-center" to="/">Volver al inicio</Link></div></div></div>;
  }

  return <div className={`login-page ${theme === "dark" ? "login-dark" : ""}`}><div className="auth-card reset-card"><div className="panel-right">{themeToggle}<Link to="/" className="logo-row"><i className="bi bi-eye-fill" /><span>Visium</span></Link><h1 className="form-heading">Solicita una demo</h1><p className="form-subheading">Conoce Visium con una demostración adaptada a tu óptica o centro médico.</p><form className="w-100" onSubmit={enviarSolicitud}><label className="form-label-custom mb-2">Nombre completo</label><input className="form-control reset-input mb-3" name="nombre" value={form.nombre} onChange={actualizarCampo} required /><label className="form-label-custom mb-2">Óptica o centro médico</label><input className="form-control reset-input mb-3" name="empresa" value={form.empresa} onChange={actualizarCampo} required /><label className="form-label-custom mb-2">Correo electrónico</label><input className="form-control reset-input mb-3" type="email" name="correo" value={form.correo} onChange={actualizarCampo} required /><label className="form-label-custom mb-2">Teléfono</label><input className="form-control reset-input mb-3" type="tel" name="telefono" value={form.telefono} onChange={actualizarCampo} required /><label className="form-label-custom mb-2">Cargo</label><input className="form-control reset-input mb-3" name="cargo" value={form.cargo} onChange={actualizarCampo} required /><label className="form-label-custom mb-2">Cantidad de sucursales</label><input className="form-control reset-input mb-3" type="number" min="1" name="sucursales" value={form.sucursales} onChange={actualizarCampo} required /><label className="form-label-custom mb-2">Mensaje (opcional)</label><textarea className="form-control contact-message mb-3" name="mensaje" value={form.mensaje} onChange={actualizarCampo} placeholder="Cuéntanos qué necesitas..." /><button className="btn btn-primary btn-login w-100 text-white" type="submit">Enviar solicitud</button></form><Link className="reset-back" to="/">Volver al inicio</Link></div></div></div>;
}
