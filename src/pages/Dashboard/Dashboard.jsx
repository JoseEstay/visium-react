import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import "./Dashboard.css";

const CITAS_KEY = "visium.citas";

function sumarMediaHora(hora = "00:00") {
  const [horas, minutos] = hora.split(":").map(Number);
  const total = (horas * 60) + minutos + 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function normalizarCita(cita) {
  const [fecha = "", hora = ""] = (cita.fecha || "").split(" ");
  const horaInicio = (cita.horaInicio || hora || "00:00").replace(/:15$/, ":30").replace(/^(\d{2}):45$/, (_, horaBase) => `${String(Number(horaBase) + 1).padStart(2, "0")}:00`);
  return {
    ...cita,
    fecha: fecha || cita.fecha,
    hora: horaInicio,
    horaFin: cita.horaFin || sumarMediaHora(horaInicio),
    motivo: cita.motivo || cita.motivoConsulta || "Consulta visual",
    pacienteNombre: cita.pacienteNombre || cita.paciente || "Paciente",
    estado: cita.estado === "Programada" ? "Reagendada" : cita.estado === "En espera" ? "Pendiente" : cita.estado,
  };
}

function claseEstado(estado = "") {
  return `status-${estado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-")}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [ahora, setAhora] = useState(() => new Date());
  const [nombreOptica, setNombreOptica] = useState('Visium');

  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(new Date()), 60_000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    let usuario = null;
    try { usuario = JSON.parse(localStorage.getItem('usuarioActual') || 'null'); } catch { usuario = null; }
    if (usuario?.optica || usuario?.sucursal) {
      setNombreOptica(usuario.optica || usuario.sucursal);
      return;
    }
    if (!usuario?.sucursalId) return;

    fetch('/data/sucursales.json')
      .then((response) => response.ok ? response.json() : [])
      .then((sucursales) => setNombreOptica(sucursales.find((sucursal) => sucursal.id === usuario.sucursalId)?.nombre || 'Visium'))
      .catch(() => setNombreOptica('Visium'));
  }, []);

  useEffect(() => {
    fetch("/data/citas.json")
      .then((response) => response.ok ? response.json() : [])
      .then((base) => {
        let guardadas = [];
        try { guardadas = JSON.parse(localStorage.getItem(CITAS_KEY) || "[]"); } catch { guardadas = []; }
        const porId = new Map(base.map((cita) => [cita.id, normalizarCita(cita)]));
        guardadas.forEach((cita) => porId.set(cita.id, normalizarCita(cita)));
        setCitas([...porId.values()].sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)));
      })
      .catch(() => setCitas([]));
  }, []);

  const fechaHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
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
  const textoPendientes = `${pendientes} cita${pendientes === 1 ? "" : "s"} pendiente${pendientes === 1 ? "" : "s"}`;
  const citaNoConfirmada = citaEnCurso && citaEnCurso.estado !== "Confirmada";

  const abrirFichaCita = () => {
    if (!citaEnCurso) return;
    navigate(`/paciente/${citaEnCurso.pacienteRut}`);
  };

  const cancelarCita = () => {
    if (!citaEnCurso) return;
    const actualizadas = citas.map((cita) => cita.id === citaEnCurso.id ? { ...cita, estado: "Cancelada" } : cita);
    setCitas(actualizadas);
    localStorage.setItem(CITAS_KEY, JSON.stringify(actualizadas));
  };

  return (
    <main className="main-content">
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
              {proximasCitas.length ? proximasCitas.slice(0, 4).map((cita) => <tr key={cita.id}><td className="col-hora">{cita.hora}</td><td className="col-paciente">{cita.pacienteNombre}</td><td className="col-motivo">{cita.motivo}</td><td><span className={`badge-status ${claseEstado(cita.estado)}`}>{cita.estado}</span></td></tr>) : <tr><td colSpan="4">No hay próximas citas programadas.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
