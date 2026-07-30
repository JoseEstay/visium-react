import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const nextAppointment = appointments[0];

  useEffect(() => {
    fetch("/data/citas.json")
      .then((response) => response.json())
      .then((data) => {
        const orderedAppointments = data.sort((first, second) =>
          new Date(first.fecha.replace(" ", "T")) - new Date(second.fecha.replace(" ", "T"))
        );
        setAppointments(orderedAppointments);
      })
      .catch((error) => console.error("Error cargando citas", error));
  }, []);

  const formatTime = (date) => date ? new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(date.replace(" ", "T"))) : "";
  const statusClass = (status) => `status-${(status || "").toLowerCase().replace(" ", "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;

  const irFicha = () => {
    if (nextAppointment) navigate(`/paciente/${nextAppointment.pacienteRut}`);
  };

  return (
    <main className="main-content">
      <section className="Saludo">
        <div className="SaludoDoctor">
          <h1>Nombre de la Optica/Rol</h1>
          <p>
            <i className="fa-solid fa-calendar" /> Jueves, 24 de Octubre • <strong>{appointments.filter((appointment) => appointment.estado === "Pendiente").length} citas pendientes</strong> hoy
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
                  <h2 className="paciente-nombre">{nextAppointment?.paciente || "Sin citas"}</h2>
                  <div className="btn-nuevopaciente">
                    <span className="badge-nuevo">PACIENTE NUEVO</span>
                  </div>

                <p className="consulta-tipo">{nextAppointment?.motivoConsulta || "No hay citas programadas"}</p>

                <div className="horario-meta">
                  <i className="bi bi-clock"></i>
                  <span>{formatTime(nextAppointment?.fecha)}</span>
                </div>
              </div>
            </div>


            <button className="btn-iniciar" onClick={irFicha} disabled={!nextAppointment}>
              <i className="bi bi-play-circle"></i>
              Confirmar cita
            </button>
          </div>
        </div>

        <div className="agenda-container">
          <div className="agenda-header">
            <h3 className="agenda-titulo">Próximas Citas</h3>
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
              {appointments.map((appointment) => <tr key={appointment.id}>
                <td className="col-hora">{formatTime(appointment.fecha)}</td>
                <td className="col-paciente">{appointment.paciente}</td>
                <td className="col-motivo">{appointment.motivoConsulta}</td>
                <td><span className={`badge-status ${statusClass(appointment.estado)}`}>{appointment.estado.toUpperCase()}</span></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
