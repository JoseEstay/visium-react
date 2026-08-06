import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import "./GestionContrasenas.css";

export default function GestionContrasenas() {
  const user = JSON.parse(localStorage.getItem("usuarioActual") || "null");
  const [passwordActual, setPasswordActual] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showActual, setShowActual] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const newPasswordInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!newPasswordInputRef.current) return;
    newPasswordInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    newPasswordInputRef.current.focus({ preventScroll: true });
  }, [passwordActual]);

  if (!user) return <Navigate to="/notFound" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setMessage("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    setGuardando(true);
    setMessage("");
    try {
      await apiFetch("/auth/me/password", {
        method: "PUT",
        body: JSON.stringify({
          passwordActual,
          nuevaPassword: password,
        }),
      });
      setMessage("Contraseña actualizada correctamente.");
      setPassword("");
      setConfirmation("");
      setPasswordActual("");
    } catch (error) {
      setMessage(error.message || "No se pudo actualizar la contraseña.");
    } finally {
      setGuardando(false);
    }
  };

  const inputActual = (
    <label>
      Contraseña actual
      <span className="password-input">
        <input
          type={showActual ? "text" : "password"}
          value={passwordActual}
          onChange={(event) => setPasswordActual(event.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setShowActual((visible) => !visible)}
          aria-label={showActual ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <i className={`bi bi-eye${showActual ? "-slash" : ""}`} />
        </button>
      </span>
    </label>
  );

  return (
    <section className="password-page">
      <div className="password-heading">
        <h1>Mi contraseña</h1>
        <p>Actualiza la contraseña de tu cuenta de acceso.</p>
      </div>
      <div className="password-grid">
        <div className="password-card">
          <form onSubmit={submit}>
            <h2>Cambiar contraseña</h2>
            <p>
              Usuario: <strong>{[user.nombre, user.apellido].filter(Boolean).join(" ")}</strong>
            </p>
            {inputActual}
            <label>
              Nueva contraseña
              <span className="password-input">
                <input
                  ref={newPasswordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength="8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <i className={`bi bi-eye${showPassword ? "-slash" : ""}`} />
                </button>
              </span>
            </label>
            <label>
              Confirmar contraseña
              <span className="password-input">
                <input
                  type={showConfirmation ? "text" : "password"}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  minLength="8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmation((visible) => !visible)}
                  aria-label={showConfirmation ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <i className={`bi bi-eye${showConfirmation ? "-slash" : ""}`} />
                </button>
              </span>
            </label>
            {message && (
              <p className={message.includes("correctamente") ? "success" : "error"}>{message}</p>
            )}
            <button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
