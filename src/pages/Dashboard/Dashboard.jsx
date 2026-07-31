import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import "./Dashboard.css";

const CITAS_KEY = "visium.citas";

function normalizarCita(cita) {
  const [fecha = "", hora = ""] = (cita.fecha || "").split(" ");
  return {
    ...cita,
    fecha: fecha || cita.fecha,
    hora: (cita.horaInicio || hora || "00:00").replace(/:15$/, ":30").replace(/^(\d{2}):45$/, (_, horaBase) => `${String(Number(horaBase) + 1).padStart(2, "0")}:00`),
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
  const citasDeHoy = useMemo(() => citas.filter((cita) => cita.fecha === fechaHoy), [citas, fechaHoy]);
  const proximaCita = citasDeHoy[0];
  const pendientes = useMemo(() => citasDeHoy.filter((cita) => cita.estado?.toLowerCase() === "pendiente").length, [citasDeHoy]);
  const fechaTitulo = new Intl.DateTimeFormat("es-CL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(ahora);
  const textoPendientes = `${pendientes} cita${pendientes === 1 ? "" : "s"} pendiente${pendientes === 1 ? "" : "s"}`;

  const confirmarCita = () => {
    if (!proximaCita) return;
    const actualizadas = citas.map((cita) => cita.id === proximaCita.id ? { ...cita, estado: "Confirmada" } : cita);
    setCitas(actualizadas);
    localStorage.setItem(CITAS_KEY, JSON.stringify(actualizadas));
    navigate(`/paciente/${proximaCita.pacienteRut}`);
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
          {proximaCita ? (
            <div className="card-izquierda">
              <div className="paciente-header">
                <div className="avatar-wrapper"><i className="bi bi-person-fill avatar-icono fs-1"></i></div>
                <div className="paciente-info">
                  <div className="nombre-badge-row"><h2 className="paciente-nombre">{proximaCita.pacienteNombre}</h2></div>
                  <p className="consulta-tipo">{proximaCita.motivo}</p>
                  <div className="horario-meta"><i className="bi bi-clock"></i><span>{proximaCita.hora}</span></div>
                  <button className="btn-iniciar" type="button" onClick={confirmarCita}><i className="bi bi-play-circle"></i>Confirmar cita</button>
                </div>
              </div>
            </div>
          ) : <p className="consulta-tipo">No hay citas programadas.</p>}
        </div>

        <div className="agenda-container">
          <div className="agenda-header"><h3 className="agenda-titulo">Próximas Citas</h3><a href="/citas" className="link-calendario">Ver Calendario Completo</a></div>
          <table className="tabla-agenda">
            <thead><tr><th>HORA</th><th>PACIENTE</th><th>MOTIVO DE CONSULTA</th><th>ESTADO</th></tr></thead>
            <tbody>
              {citas.slice(0, 4).map((cita) => <tr key={cita.id}><td className="col-hora">{cita.hora}</td><td className="col-paciente">{cita.pacienteNombre}</td><td className="col-motivo">{cita.motivo}</td><td><span className={`badge-status ${claseEstado(cita.estado)}`}>{cita.estado}</span></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
