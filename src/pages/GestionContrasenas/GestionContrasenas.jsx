import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import "./GestionContrasenas.css";

const allowedTargets = {
  "administrador sucursales": ["administrador sucursal", "recepcionista"],
  jefe: ["administrador sucursal", "recepcionista"],
  "administrador sucursal": ["recepcionista"],
};

export default function GestionContrasenas() {
  const user = JSON.parse(localStorage.getItem("usuarioActual") || "null");
  const userId = user?.id;
  const permittedRoles = allowedTargets[user?.rol] || [];
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!user) return;
    const storageKey = "visium.usuarios";
    const saved = localStorage.getItem(storageKey);
    if (saved) { setUsers(JSON.parse(saved)); return; }
    fetch("/data/usuarios.json").then((response) => response.json()).then((data) => {
      setUsers(data);
      localStorage.setItem(storageKey, JSON.stringify(data));
    });
  }, [userId]);

  if (!user || permittedRoles.length === 0) return <Navigate to="/notFound" replace />;

  const manageableUsers = users.filter((item) => permittedRoles.includes(item.rol) && (user.rol !== "administrador sucursal" || item.sucursalId === user.sucursalId));
  const openChange = (target) => { setSelected(target); setPassword(""); setConfirmation(""); setMessage(""); setShowPassword(false); setShowConfirmation(false); };
  const submit = (event) => {
    event.preventDefault();
    if (password.length < 6) { setMessage("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== confirmation) { setMessage("Las contraseñas no coinciden."); return; }
    const updated = users.map((item) => item.id === selected.id ? { ...item, password } : item);
    setUsers(updated);
    localStorage.setItem("visium.usuarios", JSON.stringify(updated));
    setMessage("Contraseña actualizada correctamente.");
    setPassword(""); setConfirmation("");
  };

  return <section className="password-page">
    <div className="password-heading"><h1>Contraseñas de usuarios</h1><p>Selecciona un usuario autorizado para actualizar sus credenciales.</p></div>
    <div className="password-grid">
      <div className="user-list"><h2>Usuarios autorizados</h2>{manageableUsers.map((target) => <button key={target.id} className={selected?.id === target.id ? "selected" : ""} onClick={() => openChange(target)}><i className="bi bi-person-circle" /><span><strong>{target.nombre}</strong><small>{target.rol} · {target.email}</small></span><i className="bi bi-chevron-right" /></button>)}</div>
      <div className="password-card">{selected ? <form onSubmit={submit}><h2>Cambiar contraseña</h2><p>Usuario: <strong>{selected.nombre}</strong></p><label>Nueva contraseña<span className="password-input"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}><i className={`bi bi-eye${showPassword ? "-slash" : ""}`} /></button></span></label><label>Confirmar contraseña<span className="password-input"><input type={showConfirmation ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength="6" required /><button type="button" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? "Ocultar contraseña" : "Mostrar contraseña"}><i className={`bi bi-eye${showConfirmation ? "-slash" : ""}`} /></button></span></label>{message && <p className={message.includes("correctamente") ? "success" : "error"}>{message}</p>}<button type="submit">Guardar contraseña</button></form> : <div className="empty-password"><i className="bi bi-shield-lock" /><p>Selecciona un usuario para cambiar su contraseña.</p></div>}</div>
    </div>
  </section>;
}
