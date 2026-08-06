import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import "./Login.css";

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");

  const requestCode = async (event) => {
    event.preventDefault();
    setEnviando(true);
    setMessage("");
    try {
      await apiFetch("/auth/password-recovery", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStep("password");
    } catch (error) {
      setMessage(error.message || "No se pudo enviar el código.");
    } finally {
      setEnviando(false);
    }
  };

  const confirmarRecuperacion = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    setEnviando(true);
    setMessage("");
    try {
      await apiFetch("/auth/password-recovery/confirm", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      navigate("/login", { state: { passwordReset: true } });
    } catch (error) {
      setMessage(error.message || "No se pudo actualizar la contraseña.");
    } finally {
      setEnviando(false);
    }
  };

  const content = step === "email" ? <form className="w-100" onSubmit={requestCode}>
    <label className="form-label-custom mb-2">Correo electrónico</label>
    <div className="input-group input-group-custom mb-3"><span className="input-group-text"><i className="bi bi-envelope" /></span><input className="form-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="usuario@visium.cl" required /></div>
    <button className="btn btn-primary btn-login w-100 text-white" type="submit" disabled={enviando}>{enviando ? "Enviando..." : "Enviar código"}</button>
  </form> : <form className="w-100" onSubmit={confirmarRecuperacion}>
    <p className="form-subheading">Se envió un código a {email}. Ingresa el código y tu nueva contraseña.</p>
    <label className="form-label-custom mb-2">Código de confirmación</label>
    <div className="input-group input-group-custom mb-3"><span className="input-group-text"><i className="bi bi-shield-check" /></span><input className="form-control" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Código recibido" required /></div>
    <label className="form-label-custom mb-2">Nueva contraseña</label><input className="form-control reset-input mb-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
    <label className="form-label-custom mb-2">Confirmar nueva contraseña</label><input className="form-control reset-input mb-3" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
    <button className="btn btn-primary btn-login w-100 text-white" type="submit" disabled={enviando}>{enviando ? "Actualizando..." : "Actualizar contraseña"}</button>
  </form>;

  return <div className={`login-page ${theme === "dark" ? "login-dark" : ""}`}><div className="auth-card reset-card"><div className="panel-right"><button className="login-theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}><i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`} /></button><div className="logo-row"><i className="bi bi-eye-fill" /><span>Visium</span></div><h1 className="form-heading">Recuperar contraseña</h1><p className="form-subheading">{step === "email" ? "Ingresa tu correo para recibir un código de confirmación." : step === "code" ? "Ingresa el código recibido por correo." : "Completa el proceso para recuperar el acceso."}</p>{message && <p className="reset-message">{message}</p>}{content}<Link className="reset-back" to="/login">Volver al inicio de sesión</Link></div></div></div>;
}
