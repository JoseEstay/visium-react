import { useEffect, useState } from 'react';
import agendarIcon from '../../assets/img/agendar.svg';
import configIcon from '../../assets/img/config.svg';
import masIcon from '../../assets/img/mas.svg';
import resumenBackground from '../../assets/img/resumen-dia-background.svg';
import seguimientoIcon from '../../assets/img/seguimiento.svg';
import userIcon from '../../assets/img/user.svg';
import './GestionCitas.css';

const PATIENTS_KEY = 'visium.admin.pacientes';
const CITAS_KEY = 'visium.citas';
const CITAS_DATA_VERSION = '2026-07-31-31-high-density';
const FECHA_DEMO = '2026-07-29';
const HORAS_REAGENDAMIENTO = Array.from({ length: 23 }, (_, indice) => {
  const hora = 9 + Math.floor(indice / 2);
  return `${String(hora).padStart(2, '0')}:${indice % 2 ? '30' : '00'}`;
});

const formVacio = { rut: '', profesional: '', fecha: FECHA_DEMO, horaInicio: '14:00', horaFin: '14:30', motivo: '' };

function fechaHoraActualTexto(fecha) {
  const fechaFormateada = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }).format(fecha);
  const horaFormateada = new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(fecha);
  return `${fechaFormateada} · ${horaFormateada}`;
}

function fechaISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function sumarMediaHora(horaInicio) {
  const [hora, minutos] = horaInicio.split(':').map(Number);
  return `${String(hora + Math.floor((minutos + 30) / 60)).padStart(2, '0')}:${String((minutos + 30) % 60).padStart(2, '0')}`;
}

function normalizarRutBusqueda(rut = '') {
  return rut.replace(/[.\s-]/g, '').toLowerCase();
}

function fechaDeCita(fecha = '') {
  return String(fecha).trim().slice(0, 10);
}

function normalizarHoraMedia(hora = '') {
  if (/:15$/.test(hora)) return hora.replace(/:15$/, ':30');
  return hora.replace(/^(\d{2}):45$/, (_, horaBase) => `${String(Number(horaBase) + 1).padStart(2, '0')}:00`);
}

function normalizarCita(cita) {
  const [fecha = '', hora = ''] = (cita.fecha || '').split(' ');
  const horaInicio = normalizarHoraMedia(cita.horaInicio || hora || '09:00');
  return {
    ...cita,
    fecha: fecha || cita.fecha,
    horaInicio,
    horaFin: normalizarHoraMedia(cita.horaFin || sumarMediaHora(horaInicio)),
    pacienteNombre: cita.pacienteNombre || cita.paciente || 'Paciente',
    motivo: cita.motivo || cita.motivoConsulta || 'Consulta visual',
    estado: cita.estado === 'Programada' ? 'Reagendada' : cita.estado === 'En espera' ? 'Pendiente' : cita.estado,
  };
}

export default function GestionCitas() {
  const [mostrarAgenda, setMostrarAgenda] = useState(false);
  const [citaAReemplazar, setCitaAReemplazar] = useState(null);
  const [citaReagendando, setCitaReagendando] = useState(null);
  const [citaACancelar, setCitaACancelar] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [busquedaProfesional, setBusquedaProfesional] = useState('');
  const [form, setForm] = useState(formVacio);
  const [fechaActual, setFechaActual] = useState(() => new Date());
  const [vistaAgenda, setVistaAgenda] = useState('Día');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(FECHA_DEMO);
  const [citas, setCitas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CITAS_KEY) || '[]').map(normalizarCita);
    } catch {
      return [];
    }
  });

  const fecha = new Date(`${fechaSeleccionada}T00:00:00`);
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();
  const primerDia = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const diasDelMes = Array.from({ length: new Date(anio, mes + 1, 0).getDate() }, (_, indice) => indice + 1);
  const citasDelDia = citas
    .filter((cita) => fechaDeCita(cita.fecha) === fechaSeleccionada)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  const fechasConCitas = new Set(citas.map((cita) => fechaDeCita(cita.fecha)));
  const cantidadCitasPorFecha = citas.reduce((resultado, cita) => {
    const fechaCita = fechaDeCita(cita.fecha);
    resultado[fechaCita] = (resultado[fechaCita] || 0) + 1;
    return resultado;
  }, {});
  const resumenDia = {
    total: citasDelDia.length,
    confirmadas: citasDelDia.filter((cita) => cita.estado === 'Confirmada').length,
    pendientes: citasDelDia.filter((cita) => cita.estado === 'Pendiente').length,
    urgencias: citasDelDia.filter((cita) => /urgencia|urgente/i.test(cita.motivo)).length,
  };
  const inicioSemana = new Date(`${fechaSeleccionada}T00:00:00`);
  inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));
  const diasSemana = Array.from({ length: 7 }, (_, indice) => {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + indice);
    return fechaISO(dia);
  });

  useEffect(() => {
    fetch('/data/pacientes.json')
      .then((respuesta) => respuesta.json())
      .then((base) => {
        let guardados = [];
        try {
          guardados = JSON.parse(localStorage.getItem(PATIENTS_KEY) || '[]');
        } catch {
          guardados = [];
        }
        const porRut = new Map(base.map((paciente) => [paciente.rut, paciente]));
        guardados.forEach((paciente) => {
          if (paciente?.rut) porRut.set(paciente.rut, { ...porRut.get(paciente.rut), ...paciente });
        });
        setPacientes([...porRut.values()]);
      })
      .catch((error) => console.error('Error cargando pacientes', error));
  }, []);

  useEffect(() => {
    fetch('/data/profesionales.json').then((respuesta) => respuesta.ok ? respuesta.json() : []).then(setProfesionales).catch(() => setProfesionales([]));
  }, []);

  useEffect(() => {
    const intervalo = window.setInterval(() => setFechaActual(new Date()), 60_000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    fetch(`/data/citas.json?v=${CITAS_DATA_VERSION}`, { cache: 'no-store' })
      .then((respuesta) => respuesta.ok ? respuesta.json() : [])
      .then((base) => {
        let guardadas = [];
        try { guardadas = JSON.parse(localStorage.getItem(CITAS_KEY) || '[]'); } catch { guardadas = []; }
        const porId = new Map(base.map((cita) => [cita.id, normalizarCita(cita)]));
        guardadas.forEach((cita) => porId.set(cita.id, normalizarCita(cita)));
        setCitas([...porId.values()]);
      })
      .catch((error) => console.error('Error cargando citas', error));
  }, [CITAS_DATA_VERSION]);

  const abrirAgenda = (horaInicio = '14:00') => {
    setCitaAReemplazar(null);
    setForm({ ...formVacio, fecha: fechaSeleccionada, horaInicio, horaFin: sumarMediaHora(horaInicio) });
    setBusquedaPaciente('');
    setBusquedaProfesional('');
    setMostrarAgenda(true);
  };

  const agendarNuevaCita = (cita) => {
    setCitaAReemplazar(cita);
    setForm({
      ...formVacio,
      rut: cita.pacienteRut,
      profesional: cita.profesional,
      fecha: fechaDeCita(cita.fecha),
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      motivo: cita.motivo,
    });
    setBusquedaPaciente('');
    setBusquedaProfesional('');
    setMostrarAgenda(true);
  };

  const cambiarEstadoCita = (id, estado) => {
    const actualizadas = citas.map((cita) => cita.id === id ? { ...cita, estado } : cita);
    localStorage.setItem(CITAS_KEY, JSON.stringify(actualizadas));
    setCitas(actualizadas);
  };

  const horarioDisponible = (fechaCita, horaInicio, citaId) => {
    const horaFin = sumarMediaHora(horaInicio);
    return !citas.some((cita) => cita.id !== citaId && cita.fecha === fechaCita && horaInicio < cita.horaFin && horaFin > cita.horaInicio);
  };

  const guardarReagendamiento = (evento) => {
    evento.preventDefault();
    if (!citaReagendando || !horarioDisponible(citaReagendando.fecha, citaReagendando.horaInicio, citaReagendando.id)) return;
    const actualizadas = citas.map((cita) => cita.id === citaReagendando.id
      ? { ...cita, fecha: citaReagendando.fecha, horaInicio: citaReagendando.horaInicio, horaFin: sumarMediaHora(citaReagendando.horaInicio), estado: 'Reagendada' }
      : cita);
    localStorage.setItem(CITAS_KEY, JSON.stringify(actualizadas));
    setCitas(actualizadas);
    setFechaSeleccionada(citaReagendando.fecha);
    setCitaReagendando(null);
  };

  const guardarCita = (evento) => {
    evento.preventDefault();
    const paciente = pacientes.find((item) => item.rut === form.rut);
    if (!paciente) return;

    if (form.horaFin <= form.horaInicio) {
      alert('La hora de término debe ser posterior a la hora de inicio.');
      return;
    }
    if (citas.some((cita) =>
      cita.id !== citaAReemplazar?.id &&
      cita.fecha === form.fecha &&
      form.horaInicio < cita.horaFin &&
      form.horaFin > cita.horaInicio
    )) {
      alert('Ya existe una cita en ese horario.');
      return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
    const nuevaCita = {
      id: citaAReemplazar?.id || `C-${Date.now()}`,
      pacienteRut: paciente.rut,
      pacienteNombre: paciente.nombre,
      profesional: form.profesional || usuario.nombre || 'Profesional por asignar',
      sucursal: paciente.sucursal,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      motivo: form.motivo.trim(),
      fecha: form.fecha,
      estado: 'Pendiente',
    };
    const actualizadas = citaAReemplazar
      ? citas.map((cita) => cita.id === citaAReemplazar.id ? nuevaCita : cita)
      : [...citas, nuevaCita];
    localStorage.setItem(CITAS_KEY, JSON.stringify(actualizadas));
    setCitas(actualizadas);
    setFechaSeleccionada(form.fecha);
    setMostrarAgenda(false);
    setCitaAReemplazar(null);
    setForm(formVacio);
  };

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <h2>Gestión de Citas</h2>
          <p className="text-capitalize">{fechaHoraActualTexto(fechaActual)}</p>
        </div>
        <button className="btn btn-primary agenda-button" type="button" onClick={() => abrirAgenda()}>
          <span className="agenda-button-content"><img src={agendarIcon} alt="" aria-hidden="true" /><span>Agendar Nueva Cita</span></span>
        </button>
      </section>

      <section className="appointments-grid" aria-label="Gestión de agenda">
        <aside className="calendar-column" aria-label="Calendario y resumen">
          <article className="card calendar-card">
            <div className="card-header">
              <h3 className="text-capitalize">{new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(fecha)}</h3>
              <div className="card-actions">
                <button className="icon-button small" type="button" aria-label="Mes anterior" onClick={() => setFechaSeleccionada(fechaISO(new Date(anio, mes - 1, 1)))}>&lt;</button>
                <button className="icon-button small" type="button" aria-label="Mes siguiente" onClick={() => setFechaSeleccionada(fechaISO(new Date(anio, mes + 1, 1)))}>&gt;</button>
              </div>
            </div>
            <div className="calendar">
              <span>LU</span><span>MA</span><span>MI</span><span>JU</span><span>VI</span><span>SA</span><span>DO</span>
              {Array.from({ length: primerDia }, (_, indice) => <i key={indice} />)}
              {diasDelMes.map((dia) => (
                <button
                  className={`${dia === fecha.getDate() ? 'selected ' : ''}${fechasConCitas.has(`${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`) ? 'has-dot ' : ''}${cantidadCitasPorFecha[`${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`] >= 8 ? 'danger-dot' : ''}`.trim()}
                  type="button"
                  key={dia}
                  onClick={() => setFechaSeleccionada(`${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`)}
                >{dia}</button>
              ))}
            </div>
            <div className="density">
              <p>Densidad de citas</p>
              <div>
                <span><i className="dot normal"></i>Normal</span>
                <span><i className="dot high"></i>Alta ocupación</span>
              </div>
            </div>
          </article>

          <article className="summary-card">
            <div>
              <span className="resumen-text">Resumen del día</span>
              <strong className="total-citas">{resumenDia.total} {resumenDia.total === 1 ? 'Cita' : 'Citas'}</strong>
            </div>
            <div className="summary-stats">
              <div><strong>{resumenDia.confirmadas}</strong><span>Confirmadas</span></div>
              <div><strong>{resumenDia.pendientes}</strong><span>Pendientes</span></div>
              <div><strong>{resumenDia.urgencias}</strong><span>Urgencias</span></div>
            </div>
            <img src={resumenBackground} alt="" className="background-img" />
          </article>
        </aside>

        <section className="agenda-card card" aria-label="Agenda diaria">
          <div className="agenda-header">
            <div className="tabs-title">
              <h3>Agenda {vistaAgenda === 'Día' ? 'Diaria' : 'Semanal'}</h3>
              <div className="tabs" aria-label="Vista de agenda">
                <button className={vistaAgenda === 'Día' ? 'active' : ''} type="button" onClick={() => setVistaAgenda('Día')}>Día</button>
                <button className={vistaAgenda === 'Semana' ? 'active' : ''} type="button" onClick={() => setVistaAgenda('Semana')}>Semana</button>
              </div>
            </div>
          </div>

          <div className={`timeline ${vistaAgenda === 'Semana' ? 'agenda-oculta' : ''}`}>
            {fechaSeleccionada === FECHA_DEMO && citas.length === 0 && <>
            <div className="time-row">
              <time>08:00</time>
              <article className="appointment completed">
                <div className="appointment-icon">
                  <img src={userIcon} alt="" aria-hidden="true" />
                </div>
                <div>
                  <h4>Elena Martinez Soler</h4>
                  <p>Examen General de Vista</p>
                </div>
                <span className="badge muted">Completado</span>
                <a href="#notas">Ver Notas</a>
              </article>
            </div>

            <div className="time-row active">
              <time>09:15</time>
              <article className="appointment selected">
                <div className="appointment-icon primary">
                  <img src={seguimientoIcon} alt="" aria-hidden="true" />
                </div>
                <div>
                  <h4>Javier Ruiz Gomez</h4>
                  <p>Seguimiento de Glaucoma</p>
                </div>
                <span className="badge primary">En progreso</span>
                <button className="icon-button small" type="button" aria-label="Mas opciones">
                  <img src={configIcon} alt="" aria-hidden="true" />
                </button>
              </article>
            </div>

            <div className="time-row">
              <time>10:30</time>
              <article className="appointment has-actions">
                <div className="appointment-icon">
                  <img src={userIcon} alt="" aria-hidden="true" />
                </div>
                <div>
                  <h4>Sofia Castro Villalba</h4>
                  <p>Consulta Pre-Operatoria</p>
                </div>
                <span className="badge info">Confirmado</span>
                <div className="appointment-actions">
                  <button className="btn btn-light" type="button">Reagendar</button>
                  <button className="btn btn-danger-link" type="button">Cancelar</button>
                </div>
              </article>
            </div>

            <div className="time-row">
              <time>11:45</time>
              <article className="appointment has-actions">
                <div className="appointment-icon">
                  <img src={userIcon} alt="" aria-hidden="true" />
                </div>
                <div>
                  <h4>Marcos Toledo</h4>
                  <p>Glaucoma (OD)</p>
                </div>
                <span className="badge warning">Pendiente</span>
                <div className="appointment-actions">
                  <button className="btn btn-primary btn-xs" type="button">Confirmar</button>
                  <button className="btn btn-danger-link" type="button">Cancelar</button>
                </div>
              </article>
            </div>
            </>}

            {citasDelDia.map((cita) => (
              <div className="time-row" key={cita.id}>
                <time>{cita.horaInicio}</time>
                <article className={`appointment ${cita.estado === 'Confirmada' || cita.estado === 'Pendiente' || cita.estado === 'Reagendada' || cita.estado === 'Cancelada' ? 'has-actions' : ''}`}>
                  <div className="appointment-icon">
                    <img src={userIcon} alt="" aria-hidden="true" />
                  </div>
                  <div>
                    <h4>{cita.pacienteNombre}</h4>
                    <p>{cita.motivo}</p>
                    <small>{cita.horaInicio}–{cita.horaFin} · {cita.profesional}</small>
                  </div>
                  <span className={`badge ${cita.estado === 'Cancelada' ? 'cancelled' : 'warning'}`}>{cita.estado}</span>
                  {cita.estado === 'Confirmada' && (
                    <div className="appointment-actions">
                      <button className="btn btn-light" type="button" onClick={() => setCitaReagendando({ ...cita })}>Reagendar</button>
                      <button className="btn btn-danger-link" type="button" onClick={() => setCitaACancelar(cita)}>Cancelar</button>
                    </div>
                  )}
                  {(cita.estado === 'Pendiente' || cita.estado === 'Reagendada') && (
                    <div className="appointment-actions">
                      <button className="btn btn-primary btn-xs" type="button" onClick={() => cambiarEstadoCita(cita.id, 'Confirmada')}>Confirmar</button>
                      <button className="btn btn-danger-link" type="button" onClick={() => setCitaACancelar(cita)}>Cancelar</button>
                    </div>
                  )}
                  {cita.estado === 'Cancelada' && (
                    <div className="appointment-actions">
                      <button className="btn btn-light" type="button" onClick={() => agendarNuevaCita(cita)}>Agendar nueva cita</button>
                    </div>
                  )}
                </article>
              </div>
            ))}

            <div className="time-row break-row">
              <time>13:00</time>
              <div className="break-line">
                <span>Almuerzo / Descanso</span>
              </div>
            </div>

            <div className="time-row">
              <time>14:00</time>
              <button className="empty-slot" type="button" onClick={() => abrirAgenda('14:00')}>
                <img src={masIcon} alt="" aria-hidden="true" />
                <span>Agendar en este día</span>
              </button>
            </div>
          </div>
          {vistaAgenda === 'Semana' && <div className="agenda-semanal">
            {diasSemana.map((dia) => {
              const citasDia = citas.filter((cita) => fechaDeCita(cita.fecha) === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
              return <section className="dia-semanal" key={dia}>
                <h4>{new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${dia}T00:00:00`))}</h4>
                {citasDia.length ? citasDia.map((cita) => <article key={cita.id}><time>{cita.horaInicio}</time><div><strong>{cita.pacienteNombre}</strong><span>{cita.motivo}</span></div></article>) : <p>Sin citas</p>}
              </section>;
            })}
          </div>}
        </section>
      </section>

      {mostrarAgenda && (
        <div className="citas-modal" onClick={() => { setMostrarAgenda(false); setCitaAReemplazar(null); }}>
          <form className="citas-modal-card" onSubmit={guardarCita} onClick={(evento) => evento.stopPropagation()}>
            <div className="citas-modal-header">
              <h2>{citaAReemplazar ? 'Reemplazar cita cancelada' : 'Agendar nueva cita'}</h2>
              <button type="button" onClick={() => { setMostrarAgenda(false); setCitaAReemplazar(null); }} aria-label="Cerrar">&times;</button>
            </div>

            <label className="citas-campo">
              Paciente
              <input className="citas-buscador" type="search" placeholder="Buscar paciente..." value={busquedaPaciente} onChange={(evento) => setBusquedaPaciente(evento.target.value)} />
              <div className="citas-lista-pacientes" role="listbox" aria-label="Listado de pacientes">
                {pacientes.filter((paciente) => paciente.estado !== 'Desactivado' && (paciente.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase()) || normalizarRutBusqueda(paciente.rut).includes(normalizarRutBusqueda(busquedaPaciente)))).map((paciente) => (
                  <button
                    key={paciente.rut}
                    type="button"
                    role="option"
                    aria-selected={form.rut === paciente.rut}
                    className={form.rut === paciente.rut ? 'activo' : ''}
                    onClick={() => setForm({ ...form, rut: paciente.rut })}
                  >
                    <strong>{paciente.nombre}</strong>
                    <span>{paciente.rut}</span>
                  </button>
                ))}
              </div>
            </label>

            <label className="citas-campo">
              Profesional
              <input className="citas-buscador" type="search" placeholder="Buscar profesional..." value={busquedaProfesional} onChange={(evento) => setBusquedaProfesional(evento.target.value)} />
              <div className="citas-lista-pacientes" role="listbox" aria-label="Listado de profesionales">
                {profesionales.filter((profesional) => `${profesional.nombre} ${profesional.especialidad}`.toLowerCase().includes(busquedaProfesional.toLowerCase())).map((profesional) => (
                  <button key={profesional.id} type="button" role="option" aria-selected={form.profesional === profesional.nombre} className={form.profesional === profesional.nombre ? 'activo' : ''} onClick={() => setForm({ ...form, profesional: profesional.nombre })}>
                    <strong>{profesional.nombre}</strong><span>{profesional.especialidad}</span>
                  </button>
                ))}
              </div>
            </label>

            <label className="citas-campo">
              Día
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(evento) => setForm({ ...form, fecha: evento.target.value })}
              />
            </label>

            <div className="citas-horario">
              <div className="citas-campo">
                <span>Hora de inicio</span>
                <div className="citas-horas-inicio" role="listbox" aria-label="Horas de inicio">
                  {HORAS_REAGENDAMIENTO.map((hora) => { const disponible = horarioDisponible(form.fecha, hora, citaAReemplazar?.id); return <button key={hora} type="button" disabled={!disponible} className={form.horaInicio === hora ? 'activo' : ''} onClick={() => setForm({ ...form, horaInicio: hora, horaFin: sumarMediaHora(hora) })}>{hora}</button>; })}
                </div>
              </div>
              <div className="citas-campo"><span>Hora de término</span><div className="citas-horas-termino"><button type="button">{form.horaFin}</button></div></div>
            </div>

            <label className="citas-campo">
              Motivo
              <input
                type="text"
                required
                placeholder="Ej. Control de glaucoma"
                value={form.motivo}
                onChange={(evento) => setForm({ ...form, motivo: evento.target.value })}
              />
            </label>

            <div className="citas-modal-acciones">
              <button type="button" className="btn btn-light" onClick={() => { setMostrarAgenda(false); setCitaAReemplazar(null); }}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={!form.rut || !form.profesional}>{citaAReemplazar ? 'Reemplazar cita' : 'Guardar cita'}</button>
            </div>
          </form>
        </div>
      )}

      {citaReagendando && (
        <div className="citas-modal" onClick={() => setCitaReagendando(null)}>
          <form className="citas-modal-card reagendar-modal" onSubmit={guardarReagendamiento} onClick={(evento) => evento.stopPropagation()}>
            <div className="citas-modal-header">
              <div><h2>Reagendar cita</h2><p>{citaReagendando.pacienteNombre}</p></div>
              <button type="button" aria-label="Cerrar" onClick={() => setCitaReagendando(null)}>&times;</button>
            </div>
            <label className="citas-campo">Selecciona el día
              <input type="date" required value={citaReagendando.fecha} onChange={(evento) => setCitaReagendando({ ...citaReagendando, fecha: evento.target.value })} />
            </label>
            <p className="reagendar-horario-titulo">Horarios disponibles · 09:00 a 20:00</p>
            <div className="reagendar-horas" role="listbox" aria-label="Horarios disponibles">
              {HORAS_REAGENDAMIENTO.map((hora) => {
                const disponible = horarioDisponible(citaReagendando.fecha, hora, citaReagendando.id);
                return <button key={hora} type="button" disabled={!disponible} className={citaReagendando.horaInicio === hora ? 'activo' : ''} onClick={() => setCitaReagendando({ ...citaReagendando, horaInicio: hora })}>{hora}</button>;
              })}
            </div>
            <div className="citas-modal-acciones">
              <button type="button" className="btn btn-light" onClick={() => setCitaReagendando(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={!horarioDisponible(citaReagendando.fecha, citaReagendando.horaInicio, citaReagendando.id)}>Guardar reagendamiento</button>
            </div>
          </form>
        </div>
      )}

      {citaACancelar && (
        <div className="citas-modal" onClick={() => setCitaACancelar(null)}>
          <section className="citas-modal-card cancelar-modal" role="dialog" aria-modal="true" aria-labelledby="cancelar-cita-titulo" onClick={(evento) => evento.stopPropagation()}>
            <div className="citas-modal-header"><h2 id="cancelar-cita-titulo">¿Cancelar cita?</h2><button type="button" aria-label="Cerrar" onClick={() => setCitaACancelar(null)}>&times;</button></div>
            <p>Se cancelará la cita de <strong>{citaACancelar.pacienteNombre}</strong> a las {citaACancelar.horaInicio}. Esta acción cambiará su estado a cancelada.</p>
            <div className="citas-modal-acciones"><button type="button" className="btn btn-light" onClick={() => setCitaACancelar(null)}>Volver</button><button type="button" className="btn btn-danger-link" onClick={() => { cambiarEstadoCita(citaACancelar.id, 'Cancelada'); setCitaACancelar(null); }}>Sí, cancelar cita</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
