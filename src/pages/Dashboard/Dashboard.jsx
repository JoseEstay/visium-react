import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useFetch } from "../../hooks/useFetch";
import { apiFetch } from "../../utils/api";
import { aInstantISO, fechaDeInstant, fechaISO, horaDeInstant, nombreCompleto } from "../../utils/formato";
import "./Dashboard.css";

const MAPA_ESTADOS = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
  ATENDIDA: "Atendida",
  NO_ASISTIO: "No asistió",
};

function sumarMediaHora(hora = "00:00") {
  const [horas, minutos] = hora.split(":").map(Number);
  const total = (horas * 60) + minutos + 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function normalizarCita(cita) {
  const horaInicio = horaDeInstant(cita.fechaHoraInicio);
  return {
    ...cita,
    fecha: fechaDeInstant(cita.fechaHoraInicio),
    hora: horaInicio,
    horaFin: horaDeInstant(cita.fechaHoraFin) || sumarMediaHora(horaInicio),
    motivo: cita.motivo || "Consulta visual",
    pacienteNombre: nombreCompleto(cita),
    estado: MAPA_ESTADOS[cita.estado] || cita.estado,
  };
}

function claseEstado(estado = "") {
  return `status-${estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-")}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [ahora, setAhora] = useState(() => new Date());
  const haceUnDia = fechaISO(new Date(ahora.getTime() - 86400000));
  const enUnMes = fechaISO(new Date(ahora.getTime() + 30 * 86400000));

  const { data: citasApi, loading, error, refresh } = useFetch(
    `/citas?desde=${haceUnDia}&hasta=${enUnMes}`,
  );

  const citas = useMemo(
    () => (Array.isArray(citasApi) ? citasApi.map(normalizarCita) : []),
    [citasApi],
  );

  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(new Date()), 60_000);
    return () => window.clearInterval(intervalo);
  }, []);

  const fechaHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  const nombreOptica = citas[0]?.sucursalNombre || 'Visium';
  const citasDeHoy = useMemo(() => citas.filter((cita) => cita.fecha === fechaHoy), [citas, fechaHoy]);
  const proximasCitas = useMemo(() => {
    const candidatas = citas.filter((cita) =>
      cita.estado !== "Cancelada" &&
      (cita.fecha > fechaHoy || (cita.fecha === fechaHoy && cita.hora >= horaActual))
    );
    const fechaMasProxima = candidatas[0]?.fecha;
    return fechaMasProxima ? candidatas.filter((cita) => cita.fecha === fechaMasProxima) : [];
  }, [citas, fechaHoy, horaActual]);
  const citaEnCurso = useMemo(() => citasDeHoy.find((cita) =>
    cita.estado !== "Cancelada" && cita.hora <= horaActual && horaActual < cita.horaFin
  ), [citasDeHoy, horaActual]);
  const fechaProximasCitas = proximasCitas[0]?.fecha;
  const tituloProximasCitas = fechaProximasCitas && fechaProximasCitas !== fechaHoy
    ? `Próximas citas · ${new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${fechaProximasCitas}T00:00:00`))}`
    : "Próximas Citas";
  const pendientes = useMemo(() => citasDeHoy.filter((cita) => cita.estado?.toLowerCase() === "pendiente").length, [citasDeHoy]);
  const fechaTitulo = new Intl.DateTimeFormat("es-CL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(ahora);
  const textoPendientes = loading
    ? "cargando agenda..."
    : `${pendientes} cita${pendientes === 1 ? "" : "s"} pendiente${pendientes === 1 ? "" : "s"}`;
  const citaNoConfirmada = citaEnCurso && citaEnCurso.estado !== "Confirmada";

  const abrirFichaCita = () => {
    if (!citaEnCurso) return;
    navigate(`/paciente/${citaEnCurso.pacienteId}`);
  };

  const cancelarCita = async () => {
    if (!citaEnCurso) return;
    try {
      await apiFetch(`/citas/${citaEnCurso.id}`, {
        method: "PUT",
        body: JSON.stringify({
          empresaId: citaEnCurso.empresaId,
          sucursalId: citaEnCurso.sucursalId,
          pacienteId: citaEnCurso.pacienteId,
          profesionalId: citaEnCurso.profesionalId,
          fechaHoraInicio: aInstantISO(citaEnCurso.fecha, citaEnCurso.hora),
          fechaHoraFin: citaEnCurso.fechaHoraFin,
          estado: "CANCELADA",
        }),
      });
      refresh();
    } catch (err) {
      alert(err.message || "No se pudo cancelar la cita.");
    }
  };

  return (
    <main className="main-content">
      {error && <p className="consulta-tipo" role="alert">No se pudo cargar la agenda: {error.message}</p>}
      <section className="Saludo">
        <div className="SaludoDoctor">
          <h1>{nombreOptica}</h1>
          <p><i className="fa-solid fa-calendar" /> {fechaTitulo} • <strong>{textoPendientes}</strong> hoy</p>
        </div>
      </section>

      <div className="grid-row-2">
        <div className="card-paciente">
          {citaEnCurso ? (
            <div className="card-izquierda">
              <div className="paciente-header">
                <div className="avatar-wrapper"><i className="bi bi-person-fill avatar-icono fs-1"></i></div>
                <div className="paciente-info">
                  <div className="nombre-badge-row"><h2 className="paciente-nombre">{citaEnCurso.pacienteNombre}</h2></div>
                  <p className="consulta-tipo">{citaEnCurso.motivo}</p>
                  <div className="horario-meta"><i className="bi bi-clock"></i><span>{citaEnCurso.hora}</span></div>
                  {citaNoConfirmada ? <>
                    <p className="cita-no-confirmada"><i className="bi bi-exclamation-circle" /> Cita no confirmada</p>
                    <div className="cita-acciones">
                      <button className="btn-reagendar" type="button" onClick={() => navigate("/citas")}><i className="bi bi-calendar-event" /> Reagendar</button>
                      <button className="btn-cancelar" type="button" onClick={cancelarCita}><i className="bi bi-x-circle" /> Cancelar</button>
                    </div>
                  </> : <button className="btn-iniciar" type="button" onClick={abrirFichaCita}><i className="bi bi-folder2-open"></i>Abrir ficha</button>}
                </div>
              </div>
            </div>
          ) : <p className="consulta-tipo">No hay pacientes en atención en este momento.</p>}
        </div>

        <div className="agenda-container">
          <div className="agenda-header"><h3 className="agenda-titulo text-capitalize">{tituloProximasCitas}</h3><a href="/citas" className="link-calendario">Ver Calendario Completo</a></div>
          <table className="tabla-agenda">
            <thead><tr><th>HORA</th><th>PACIENTE</th><th>MOTIVO DE CONSULTA</th><th>ESTADO</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="4">Cargando citas...</td></tr> : proximasCitas.length ? proximasCitas.slice(0, 4).map((cita) => <tr key={cita.id}><td className="col-hora">{cita.hora}</td><td className="col-paciente">{cita.pacienteNombre}</td><td className="col-motivo">{cita.motivo}</td><td><span className={`badge-status ${claseEstado(cita.estado)}`}>{cita.estado}</span></td></tr>) : <tr><td colSpan="4">No hay próximas citas programadas.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
