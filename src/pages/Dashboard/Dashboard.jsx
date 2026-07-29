import { useNavigate } from "react-router";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const irFicha = () => {
    navigate('/paciente');
  };

  return (
    <main className="main-content">
      <section className="Saludo">
        <div className="SaludoDoctor">
          <h1>Nombre de la Optica/Rol</h1>
          <p>
            <i className="fa-solid fa-calendar" /> Jueves, 24 de Octubre • <strong>4 citas pendientes</strong> hoy
          </p>
        </div>
      </section>

      <div className="grid-row-2">
        <div className="card-paciente">
          
          <div className="card-izquierda">
            <div className="paciente-header">
                          
              <div className="avatar-wrapper">
                <i className="bi bi-person-fill avatar-icono fs-1"></i>
              </div>

              <div className="paciente-info">
                <div className="nombre-badge-row">
                  <h2 className="paciente-nombre">Maria<br />González</h2>
                </div>

                <p className="consulta-tipo">Consulta postoperatoria</p>
                <p className="consulta-subtext">(Catarata)</p>

                <div className="horario-meta">
                  <i className="bi bi-clock"></i>
                  <span>10:30 AM</span>
                </div>
              </div>
              <div className="btn-nuevopaciente">
              <span className="badge-nuevo">PACIENTE<br />NUEVO</span>
              </div>
            </div>


            <button className="btn-iniciar" onClick={irFicha}>
              <i className="bi bi-play-circle"></i>
              Confirmar cita
            </button>
          </div>


          <div className="separador-vertical"></div>


          <div className="card-derecha">
            <button className="btn-estado" type="button">
              <i className="bi bi-info-circle-fill"></i>
              Estado del perfil
            </button>
          </div>
        </div>

        <div className="agenda-container">
          <div className="agenda-header">
            <h3 className="agenda-titulo">Agenda Diaria</h3>
            <a href="#" className="link-calendario">Ver Calendario Completo</a>
          </div>

          <table className="tabla-agenda">
            <thead>
              <tr>
                <th>HORA</th>
                <th>PACIENTE</th>
                <th>MOTIVO DE CONSULTA</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="col-hora">09:00</td>
                <td className="col-paciente">Carlos Rodriguez</td>
                <td className="col-motivo">Examen de Fondo de Ojo</td>
                <td>
                  <span className="badge-status status-completado">COMPLETADO</span>
                </td>
              </tr>
              <tr id="fila-maria-agenda">
                <td className="col-hora">10:30</td>
                <td className="col-paciente">Maria González</td>
                <td className="col-motivo">Post-op Catarata</td>
                <td>
                  <span className="badge-status status-siguiente" id="status-maria-badge">SIGUIENTE</span>
                </td>
              </tr>
              <tr>
                <td className="col-hora">11:45</td>
                <td className="col-paciente">Ana Silva</td>
                <td className="col-motivo">Refracción Visual</td>
                <td>
                  <span className="badge-status status-espera">EN ESPERA</span>
                </td>
              </tr>
              <tr>
                <td className="col-hora">14:00</td>
                <td className="col-paciente">Roberto</td>
                <td className="col-motivo">Consulta de Ojo</td>
                <td>
                  <span className="badge-status status-programado">PROGRAMADO</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

