import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const TEST_CODE = "111-111";

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");

  const getUsers = () => {
    return fetch("/data/usuarios.json").then((response) => response.json()).then((baseUsers) => {
      let storedUsers = [];
      try { storedUsers = JSON.parse(localStorage.getItem("visium.usuarios") || "[]"); } catch (error) { console.error("Error leyendo usuarios guardados", error); }
      const storedById = new Map(storedUsers.map((user) => [user.id, user]));
      return [
        ...baseUsers.map((user) => ({ ...user, ...(storedById.get(user.id) || {}) })),
        ...storedUsers.filter((user) => !baseUsers.some((baseUser) => baseUser.id === user.id))
      ];
    });
  };

  const requestCode = (event) => {
    event.preventDefault();
    getUsers().then((users) => {
      if (!users.some((user) => user.email?.trim().toLowerCase() === email.trim().toLowerCase())) { setMessage("No existe un usuario con ese correo."); return; }
      setMessage("");
      setStep("code");
    });
  };

  const validateCode = (event) => {
    event.preventDefault();
    if (code !== TEST_CODE) { setMessage("El código de confirmación no es válido."); return; }
    setMessage("");
    setStep("password");
  };

  const resetPassword = (event) => {
    event.preventDefault();
    if (password.length < 6) { setMessage("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== confirmation) { setMessage("Las contraseñas no coinciden."); return; }
    getUsers().then((users) => {
      localStorage.setItem("visium.usuarios", JSON.stringify(users.map((user) => user.email?.trim().toLowerCase() === email.trim().toLowerCase() ? { ...user, password } : user)));
      navigate("/login", { state: { passwordReset: true } });
    });
  };

  const content = step === "email" ? <form className="w-100" onSubmit={requestCode}>
    <label className="form-label-custom mb-2">Correo electrónico</label>
    <div className="input-group input-group-custom mb-3"><span className="input-group-text"><i className="bi bi-envelope" /></span><input className="form-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="usuario@visium.cl" required /></div>
    <button className="btn btn-primary btn-login w-100 text-white" type="submit">Enviar código</button>
  </form> : step === "code" ? <form className="w-100" onSubmit={validateCode}>
    <p className="form-subheading">Se envió un código a {email}. Para esta demostración use <strong>{TEST_CODE}</strong>.</p>
    <label className="form-label-custom mb-2">Código de confirmación</label>
    <div className="input-group input-group-custom mb-3"><span className="input-group-text"><i className="bi bi-shield-check" /></span><input className="form-control" value={code} onChange={(event) => setCode(event.target.value)} placeholder="111-111" required /></div>
    <button className="btn btn-primary btn-login w-100 text-white" type="submit">Validar código</button>
  </form> : <form className="w-100" onSubmit={resetPassword}>
    <label className="form-label-custom mb-2">Nueva contraseña</label><input className="form-control reset-input mb-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
    <label className="form-label-custom mb-2">Confirmar nueva contraseña</label><input className="form-control reset-input mb-3" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
    <button className="btn btn-primary btn-login w-100 text-white" type="submit">Actualizar contraseña</button>
  </form>;

  return <div className="login-page"><div className="auth-card reset-card"><div className="panel-right"><div className="logo-row"><i className="bi bi-eye-fill" /><span>Visium</span></div><h1 className="form-heading">Recuperar contraseña</h1><p className="form-subheading">{step === "email" ? "Ingresa tu correo para recibir un código de confirmación." : "Completa el proceso para recuperar el acceso."}</p>{message && <p className="reset-message">{message}</p>}{content}<Link className="reset-back" to="/login">Volver al inicio de sesión</Link></div></div></div>;
}
