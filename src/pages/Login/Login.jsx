import { useState } from "react";

import "./Login.css";
import { Link, useNavigate } from "react-router";

function Login() {
  const [medico, setMedico] = useState("");

  const [password, setPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);

  const navigate = useNavigate();

  const logueado = (e) => {
    e.preventDefault();
    const storedUsers = localStorage.getItem("visium.usuarios");
    (storedUsers ? Promise.resolve(JSON.parse(storedUsers)) : fetch("/data/usuarios.json").then((response) => response.json()))
      .then((usuarios) => {
        const usuario = usuarios.find((item) => item.email === medico && item.password === password);
        if (!usuario) { alert("Datos incorrectos"); return; }
        localStorage.setItem("sesionIniciada", "true");
        localStorage.setItem("usuarioActual", JSON.stringify(usuario));
        navigate("/dashboard");
      });
  };

  return (
    <div className="login-page">
      <div className="auth-card">
        <div className="row g-0 align-items-stretch">
          {/* PANEL IZQUIERDO */}

          <div className="col-md-12 col-lg-5 d-none d-md-flex panel-left">
            <div>
              <div className="brand-title">Visium</div>

              <div className="brand-subtitle">
                Plataforma Integral para Médicos Tratantes
              </div>
            </div>

            <Feature
              icon="bi-shield-lock-fill"
              title="Intercambio Seguro"
              text="Cifrado de extremo a extremo para el envío de expedientes y resultados oculares."
            />

            <Feature
              icon="bi-graph-up"
              title="Seguimiento en Tiempo Real"
              text="Monitoree la evolución de sus pacientes derivados con reportes detallados."
            />

            <Feature
              icon="bi-bar-chart-fill"
              title="Datos Estructurados"
              text="Acceso a tomografías y campimetrías en formatos de alta precisión clínica."
            />

            <div className="footer-note">
              Certificado bajo estándares internacionales de salud digital.
            </div>
          </div>

          {/* PANEL DERECHO */}

          <div className="col-12 col-lg-7 panel-right">
            <div className="logo-row">
              <i className="bi bi-eye-fill"></i>

              <span>Visium</span>
            </div>

            <h1 className="form-heading">Portal de Médico Tratante</h1>

            <p className="form-subheading">
              Ingrese sus credenciales para acceder al panel clínico.
            </p>

            <form className="w-100" onSubmit={logueado}>
              <div className="mb-3">
                <label className="form-label-custom mb-2">
                  Id médico o correo electrónico
                </label>

                <div className="input-group input-group-custom">
                  <span className="input-group-text">
                    <i className="bi bi-person-vcard"></i>
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="ej. MED-123456"
                    value={medico}
                    onChange={(e) => setMedico(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3 position-relative">
                <label className="form-label-custom mb-2 d-block">
                  Contraseña
                  <a className="forgot-password" href="/recuperar-contrasena">
                    ¿Olvidó su contraseña?
                  </a>
                </label>

                <div className="input-group input-group-custom">
                  <span className="input-group-text">
                    <i className="bi bi-lock-fill"></i>
                  </span>

                  <input
                    type={mostrarPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="toggle-eye"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                  >
                    <i
                      className={
                        mostrarPassword ? "bi bi-eye-slash" : "bi bi-eye"
                      }
                    ></i>
                  </button>
                </div>
              </div>

              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="remember"
                />

                <label className="form-check-label" htmlFor="remember">
                  Recordar mi sesión en este equipo
                </label>
              </div>

              <button
                type="submit"
                className="
                btn
                btn-primary
                btn-login
                w-100
                text-white
                d-flex
                align-items-center
                justify-content-center
                gap-2
                "
              >
                Iniciar Sesión
                <i className="bi bi-box-arrow-in-right"></i>
              </button>
            </form>

            <div className="bottom-row">
              <Link to="/contacto" className="d-flex align-items-center gap-2 text-secondary support-link">
                <i className="bi bi-headset"></i>
                Soporte Técnico
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature-row">
      <div className="feature-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <div>
        <div className="feature-title">{title}</div>

        <p className="feature-text">{text}</p>
      </div>
    </div>
  );
}

export default Login;
