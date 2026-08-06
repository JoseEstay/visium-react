import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import agendarIcon from '../../assets/img/agendar.svg';
import masIcon from '../../assets/img/mas.svg';
import resumenBackground from '../../assets/img/resumen-dia-background.svg';
import userIcon from '../../assets/img/user.svg';
import { useFetch } from '../../hooks/useFetch';
import { apiFetch, getEmpresaActivaId } from '../../utils/api';
import { aInstantISO, fechaDeInstant, fechaISO, horaDeInstant, nombreCompleto } from '../../utils/formato';
import './GestionCitas.css';

const HORAS_REAGENDAMIENTO = Array.from({ length: 23 }, (_, indice) => {
  const hora = 9 + Math.floor(indice / 2);
  return `${String(hora).padStart(2, '0')}:${indice % 2 ? '30' : '00'}`;
});

const MAPA_ESTADOS = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  ATENDIDA: 'Atendida',
  NO_ASISTIO: 'No asistió',
};

const formVacio = { pacienteId: '', profesionalId: '', fecha: fechaISO(), horaInicio: '14:00', horaFin: '14:30', motivo: '' };

const formConsultaVacio = { motivoConsulta: '', anamnesis: '', examenVisual: '', diagnostico: '', observaciones: '' };

function fechaHoraActualTexto(fecha) {
  const fechaFormateada = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }).format(fecha);
  const horaFormateada = new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(fecha);
  return `${fechaFormateada} · ${horaFormateada}`;
}

function sumarMediaHora(horaInicio) {
  const [hora, minutos] = horaInicio.split(':').map(Number);
  return `${String(hora + Math.floor((minutos + 30) / 60)).padStart(2, '0')}:${String((minutos + 30) % 60).padStart(2, '0')}`;
}

function normalizarRutBusqueda(rut = '') {
  return String(rut || '').replace(/[.\s-]/g, '').toLowerCase();
}

function fechaDeCita(fecha = '') {
  return String(fecha).trim().slice(0, 10);
}

function normalizarCita(cita) {
  const horaInicio = horaDeInstant(cita.fechaHoraInicio);
  return {
    ...cita,
    fecha: fechaDeInstant(cita.fechaHoraInicio),
    horaInicio,
    horaFin: horaDeInstant(cita.fechaHoraFin) || sumarMediaHora(horaInicio),
    pacienteNombre: nombreCompleto(cita),
    motivo: cita.motivo || 'Consulta visual',
    estado: MAPA_ESTADOS[cita.estado] || cita.estado,
  };
}

export default function GestionCitas() {
  const navigate = useNavigate();
  const agendaSemanalRef = useRef(null);
  const agendaSemanalDetalleRef = useRef(null);
  const agendaSemanalScrollRef = useRef(null);
  const [mostrarAgenda, setMostrarAgenda] = useState(false);
  const [citaAReemplazar, setCitaAReemplazar] = useState(null);
  const [citaReagendando, setCitaReagendando] = useState(null);
  const [citaACancelar, setCitaACancelar] = useState(null);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [busquedaProfesional, setBusquedaProfesional] = useState('');
  const [form, setForm] = useState(formVacio);
  const [formConsulta, setFormConsulta] = useState(formConsultaVacio);
  const [citaEnConsulta, setCitaEnConsulta] = useState(null);
  const [consultaGuardada, setConsultaGuardada] = useState(null);
  const [fechaActual, setFechaActual] = useState(() => new Date());
  const [vistaAgenda, setVistaAgenda] = useState('Día');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => fechaISO(new Date()));

  const hoy = new Date();
  const rangoInicio = fechaISO(new Date(hoy.getTime() - 7 * 86400000));
  const rangoFin = fechaISO(new Date(hoy.getTime() + 120 * 86400000));

  const { data: pacientesApi } = useFetch('/pacientes?page=0&size=200');
  const { data: profesionalesApi } = useFetch('/profesionales');
  const { data: sucursalesApi } = useFetch('/sucursales');
  const { data: citasApi, refresh: refrescarCitas } = useFetch(`/citas?desde=${rangoInicio}&hasta=${rangoFin}`);

  const pacientes = Array.isArray(pacientesApi?.content) ? pacientesApi.content : [];
  const profesionales = Array.isArray(profesionalesApi) ? profesionalesApi : [];
  const sucursales = Array.isArray(sucursalesApi) ? sucursalesApi : [];
  const citas = (Array.isArray(citasApi) ? citasApi : []).map(normalizarCita);

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

  const moverAgendaSemanal = (direccion) => {
    agendaSemanalRef.current?.scrollBy({ left: direccion * 280, behavior: 'smooth' });
  };

  const desplazarAgendaConRueda = (evento) => {
    if (!agendaSemanalRef.current || !evento.deltaY) return;
    evento.preventDefault();
    agendaSemanalRef.current.scrollLeft += evento.deltaY;
  };

  const sincronizarDesplazamientoSemanal = (origen) => {
    const destino = origen === 'barra' ? agendaSemanalDetalleRef.current : agendaSemanalScrollRef.current;
    const fuente = origen === 'barra' ? agendaSemanalScrollRef.current : agendaSemanalDetalleRef.current;
    if (destino && fuente && destino.scrollLeft !== fuente.scrollLeft) destino.scrollLeft = fuente.scrollLeft;
  };

  useEffect(() => {
    if (vistaAgenda !== 'Día') return;
    const centrarDiaSeleccionado = () => {
      const selector = agendaSemanalRef.current;
      const diaSeleccionado = selector?.querySelector('.dia-semanal.selected');
      if (!selector || !diaSeleccionado) return;
      selector.scrollTo({
        left: diaSeleccionado.offsetLeft - ((selector.clientWidth - diaSeleccionado.clientWidth) / 2),
        behavior: 'smooth',
      });
    };

    const frame = window.requestAnimationFrame(centrarDiaSeleccionado);
    window.addEventListener('resize', centrarDiaSeleccionado);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', centrarDiaSeleccionado);
    };
  }, [fechaSeleccionada, vistaAgenda]);

  useEffect(() => {
    const intervalo = window.setInterval(() => setFechaActual(new Date()), 60_000);
    return () => window.clearInterval(intervalo);
  }, []);

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
      pacienteId: cita.pacienteId,
      profesionalId: cita.profesionalId,
      fecha: fechaDeCita(cita.fecha),
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      motivo: cita.motivo,
    });
    setBusquedaPaciente('');
    setBusquedaProfesional('');
    setMostrarAgenda(true);
  };

  const confirmarCita = async (cita) => {
    try {
      await apiFetch(`/citas/${cita.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          empresaId: cita.empresaId,
          sucursalId: cita.sucursalId,
          pacienteId: cita.pacienteId,
          profesionalId: cita.profesionalId,
          fechaHoraInicio: cita.fechaHoraInicio,
          fechaHoraFin: cita.fechaHoraFin,
          estado: 'CONFIRMADA',
        }),
      });
      refrescarCitas();
    } catch (err) {
      alert(err.message || 'No se pudo confirmar la cita.');
    }
  };

  const cancelarCita = async (cita) => {
    try {
      await apiFetch(`/citas/${cita.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          empresaId: cita.empresaId,
          sucursalId: cita.sucursalId,
          pacienteId: cita.pacienteId,
          profesionalId: cita.profesionalId,
          fechaHoraInicio: cita.fechaHoraInicio,
          fechaHoraFin: cita.fechaHoraFin,
          estado: 'CANCELADA',
        }),
      });
      setCitaACancelar(null);
      refrescarCitas();
    } catch (err) {
      alert(err.message || 'No se pudo cancelar la cita.');
    }
  };

  const guardarConsulta = async (evento) => {
    evento.preventDefault();
    if (!citaEnConsulta) return;
    try {
      await apiFetch('/consultas/cerrar-cita', {
        method: 'POST',
        body: JSON.stringify({
          citaId: citaEnConsulta.id,
          motivoConsulta: formConsulta.motivoConsulta.trim(),
          anamnesis: formConsulta.anamnesis.trim(),
          examenVisual: formConsulta.examenVisual.trim(),
          diagnostico: formConsulta.diagnostico.trim(),
          observaciones: formConsulta.observaciones.trim(),
        }),
      });
      setConsultaGuardada({
        pacienteId: citaEnConsulta.pacienteId,
        pacienteNombre: citaEnConsulta.pacienteNombre,
      });
      setCitaEnConsulta(null);
      setFormConsulta(formConsultaVacio);
      refrescarCitas();
    } catch (err) {
      alert(err.message || 'No se pudo registrar la consulta.');
    }
  };

  const horarioDisponible = (fechaCita, horaInicio, citaId) => {
    const horaFin = sumarMediaHora(horaInicio);
    return !citas.some((cita) => cita.id !== citaId && cita.fecha === fechaCita && horaInicio < cita.horaFin && horaFin > cita.horaInicio);
  };

  const guardarReagendamiento = async (evento) => {
    evento.preventDefault();
    if (!citaReagendando || !horarioDisponible(citaReagendando.fecha, citaReagendando.horaInicio, citaReagendando.id)) return;
    try {
      await apiFetch(`/citas/${citaReagendando.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          empresaId: citaReagendando.empresaId,
          sucursalId: citaReagendando.sucursalId,
          pacienteId: citaReagendando.pacienteId,
          profesionalId: citaReagendando.profesionalId,
          fechaHoraInicio: aInstantISO(citaReagendando.fecha, citaReagendando.horaInicio),
          fechaHoraFin: aInstantISO(citaReagendando.fecha, sumarMediaHora(citaReagendando.horaInicio)),
          motivo: citaReagendando.motivo,
        }),
      });
      setFechaSeleccionada(citaReagendando.fecha);
      setCitaReagendando(null);
      refrescarCitas();
    } catch (err) {
      alert(err.message || 'No se pudo reagendar la cita.');
    }
  };

  const guardarCita = async (evento) => {
    evento.preventDefault();
    if (!form.pacienteId || !form.profesionalId) return;

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
    const sucursalId = citaAReemplazar?.sucursalId || usuario?.sucursalIds?.[0] || sucursales?.[0]?.id;
    if (!sucursalId) {
      alert('No tienes una sucursal asignada para agendar citas.');
      return;
    }

    try {
      const cuerpo = {
        empresaId: getEmpresaActivaId() || usuario?.empresaIds?.[0],
        sucursalId,
        pacienteId: form.pacienteId,
        profesionalId: form.profesionalId,
        fechaHoraInicio: aInstantISO(form.fecha, form.horaInicio),
        fechaHoraFin: aInstantISO(form.fecha, form.horaFin),
        motivo: form.motivo.trim(),
      };
      if (citaAReemplazar) {
        await apiFetch(`/citas/${citaAReemplazar.id}`, { method: 'PUT', body: JSON.stringify(cuerpo) });
      } else {
        await apiFetch('/citas', { method: 'POST', body: JSON.stringify(cuerpo) });
      }
      setFechaSeleccionada(form.fecha);
      setMostrarAgenda(false);
      setCitaAReemplazar(null);
      setForm(formVacio);
      refrescarCitas();
    } catch (err) {
      alert(err.message || 'No se pudo guardar la cita.');
    }
  };

  const nombreProfesional = (cita) =>
    profesionales.find((profesional) => profesional.id === cita.profesionalId)?.nombre ||
    cita.profesional ||
    'Profesional';

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
              <h3>Agenda {vistaAgenda === 'Día' ? 'diaria' : 'semanal'}</h3>
              <div className="tabs" aria-label="Vista de agenda">
                <button className={vistaAgenda === 'Día' ? 'active' : ''} type="button" onClick={() => setVistaAgenda('Día')}>Día</button>
                <button className={vistaAgenda === 'Semana' ? 'active' : ''} type="button" onClick={() => setVistaAgenda('Semana')}>Semana</button>
              </div>
              {vistaAgenda === 'Día' && <div className="agenda-slider-controls" aria-label="Navegación del resumen semanal">
                <button type="button" onClick={() => moverAgendaSemanal(-1)} aria-label="Ver días anteriores"><i className="bi bi-chevron-left" /></button>
                <button type="button" onClick={() => moverAgendaSemanal(1)} aria-label="Ver días siguientes"><i className="bi bi-chevron-right" /></button>
              </div>}
            </div>
          </div>

          {vistaAgenda === 'Día' && <div className="agenda-semanal" ref={agendaSemanalRef} onWheel={desplazarAgendaConRueda} aria-label="Resumen semanal; usa la rueda del mouse para navegar">
            {diasSemana.map((dia) => {
              const cantidad = cantidadCitasPorFecha[dia] || 0;
              return <button className={`dia-semanal ${dia === fechaSeleccionada ? 'selected' : ''}`} type="button" key={dia} onClick={() => setFechaSeleccionada(dia)} aria-pressed={dia === fechaSeleccionada}>
                <strong>{new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${dia}T00:00:00`)).replace('.', '')}</strong>
                <span>{cantidad ? `${cantidad} ${cantidad === 1 ? 'cita' : 'citas'}` : 'Sin citas'}</span>
              </button>;
            })}
          </div>}

          <div className={`timeline ${vistaAgenda === 'Semana' ? 'agenda-oculta' : ''}`}>
            {citasDelDia.map((cita) => (
              <div className="time-row" key={cita.id}>
                <time>{cita.horaInicio}</time>
                <article className={`appointment ${['Confirmada', 'Pendiente', 'Reagendada', 'Cancelada'].includes(cita.estado) ? 'has-actions' : ''}`}>
                  <div className="appointment-icon">
                    <img src={userIcon} alt="" aria-hidden="true" />
                  </div>
                  <div>
                    <h4>{cita.pacienteNombre}</h4>
                    <p>{cita.motivo}</p>
                    <small>{cita.horaInicio}–{cita.horaFin} · {nombreProfesional(cita)}</small>
                  </div>
                  <span className={`badge ${cita.estado === 'Cancelada' ? 'cancelled' : 'warning'}`}>{cita.estado}</span>
                  {cita.estado === 'Confirmada' && (
                    <div className="appointment-actions">
                      <button className="btn btn-primary btn-xs" type="button" onClick={() => { setFormConsulta(formConsultaVacio); setCitaEnConsulta(cita); }}>Cerrar cita</button>
                      <button className="btn btn-light" type="button" onClick={() => setCitaReagendando({ ...cita })}>Reagendar</button>
                      <button className="btn btn-danger-link" type="button" onClick={() => setCitaACancelar(cita)}>Cancelar</button>
                    </div>
                  )}
                  {cita.estado === 'Pendiente' && (
                    <div className="appointment-actions">
                      <button className="btn btn-primary btn-xs" type="button" onClick={() => confirmarCita(cita)}>Confirmar</button>
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
            {citasDelDia.length === 0 && <p className="agenda-sin-citas">No hay citas para este día.</p>}

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
          {vistaAgenda === 'Semana' && <>
            <div className="agenda-semanal-scroll" ref={agendaSemanalScrollRef} onScroll={() => sincronizarDesplazamientoSemanal('barra')} aria-label="Desplazamiento horizontal de agenda semanal"><div /></div>
            <div className="agenda-semanal-detalle" ref={agendaSemanalDetalleRef} onScroll={() => sincronizarDesplazamientoSemanal('detalle')}>
              {diasSemana.map((dia) => {
                const citasDia = citas.filter((cita) => fechaDeCita(cita.fecha) === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
                return <section className="agenda-dia-detalle" key={dia}>
                  <h4>{new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${dia}T00:00:00`)).replace('.', '')}</h4>
                  {citasDia.length ? citasDia.map((cita) => <article key={cita.id}><time>{cita.horaInicio}</time><div><strong>{cita.pacienteNombre}</strong><span>{cita.motivo}</span></div></article>) : <p>Sin citas</p>}
                </section>;
              })}
            </div>
          </>}
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
                {pacientes.filter((paciente) => paciente.activo !== false && (nombreCompleto(paciente).toLowerCase().includes(busquedaPaciente.toLowerCase()) || normalizarRutBusqueda(paciente.numeroDocumento).includes(normalizarRutBusqueda(busquedaPaciente)))).map((paciente) => (
                  <button
                    key={paciente.id}
                    type="button"
                    role="option"
                    aria-selected={form.pacienteId === paciente.id}
                    className={form.pacienteId === paciente.id ? 'activo' : ''}
                    onClick={() => setForm({ ...form, pacienteId: paciente.id })}
                  >
                    <strong>{nombreCompleto(paciente)}</strong>
                    <span>{paciente.numeroDocumento || ''}</span>
                  </button>
                ))}
              </div>
            </label>

            <label className="citas-campo">
              Profesional
              <input className="citas-buscador" type="search" placeholder="Buscar profesional..." value={busquedaProfesional} onChange={(evento) => setBusquedaProfesional(evento.target.value)} />
              <div className="citas-lista-pacientes" role="listbox" aria-label="Listado de profesionales">
                {profesionales.filter((profesional) => profesional.activo !== false && `${nombreCompleto(profesional)} ${profesional.especialidad}`.toLowerCase().includes(busquedaProfesional.toLowerCase())).map((profesional) => (
                  <button key={profesional.id} type="button" role="option" aria-selected={form.profesionalId === profesional.id} className={form.profesionalId === profesional.id ? 'activo' : ''} onClick={() => setForm({ ...form, profesionalId: profesional.id })}>
                    <strong>{nombreCompleto(profesional)}</strong><span>{profesional.especialidad}</span>
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
              <button type="submit" className="btn btn-primary" disabled={!form.pacienteId || !form.profesionalId}>{citaAReemplazar ? 'Reemplazar cita' : 'Guardar cita'}</button>
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
            <div className="citas-modal-acciones"><button type="button" className="btn btn-light" onClick={() => setCitaACancelar(null)}>Volver</button><button type="button" className="btn btn-danger-link" onClick={() => cancelarCita(citaACancelar)}>Sí, cancelar cita</button></div>
          </section>
        </div>
      )}

      {citaEnConsulta && (
        <div className="citas-modal" onClick={() => setCitaEnConsulta(null)}>
          <form className="citas-modal-card consulta-modal" onSubmit={guardarConsulta} onClick={(evento) => evento.stopPropagation()}>
            <div className="citas-modal-header">
              <div>
                <h2>Registrar consulta</h2>
                <p>{citaEnConsulta.pacienteNombre} · {citaEnConsulta.horaInicio} · {nombreProfesional(citaEnConsulta)}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => setCitaEnConsulta(null)}>&times;</button>
            </div>
            <label className="citas-campo">
              Motivo de la consulta
              <input type="text" required placeholder="Ej. Control de glaucoma" value={formConsulta.motivoConsulta} onChange={(evento) => setFormConsulta({ ...formConsulta, motivoConsulta: evento.target.value })} />
            </label>
            <label className="citas-campo">
              Anamnesis
              <textarea required placeholder="Antecedentes y síntomas del paciente" value={formConsulta.anamnesis} onChange={(evento) => setFormConsulta({ ...formConsulta, anamnesis: evento.target.value })} />
            </label>
            <label className="citas-campo">
              Examen visual
              <textarea placeholder="Resultados de la evaluación visual" value={formConsulta.examenVisual} onChange={(evento) => setFormConsulta({ ...formConsulta, examenVisual: evento.target.value })} />
            </label>
            <label className="citas-campo">
              Diagnóstico
              <input type="text" required placeholder="Ej. Miopía leve" value={formConsulta.diagnostico} onChange={(evento) => setFormConsulta({ ...formConsulta, diagnostico: evento.target.value })} />
            </label>
            <label className="citas-campo">
              Observaciones
              <textarea placeholder="Indicaciones o próximos controles" value={formConsulta.observaciones} onChange={(evento) => setFormConsulta({ ...formConsulta, observaciones: evento.target.value })} />
            </label>
            <div className="citas-modal-acciones">
              <button type="button" className="btn btn-light" onClick={() => setCitaEnConsulta(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Cerrar cita y registrar consulta</button>
            </div>
          </form>
        </div>
      )}

      {consultaGuardada && (
        <div className="citas-modal" onClick={() => setConsultaGuardada(null)}>
          <section className="citas-modal-card" role="dialog" aria-modal="true" aria-labelledby="consulta-guardada-titulo" onClick={(evento) => evento.stopPropagation()}>
            <div className="citas-modal-header">
              <div>
                <h2 id="consulta-guardada-titulo">Consulta registrada</h2>
                <p>{consultaGuardada.pacienteNombre}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => setConsultaGuardada(null)}>&times;</button>
            </div>
            <p>La consulta quedó registrada y la cita pasó a estado Atendida.</p>
            <div className="citas-modal-acciones">
              <button type="button" className="btn btn-light" onClick={() => setConsultaGuardada(null)}>Cerrar</button>
              <button type="button" className="btn btn-primary" onClick={() => navigate(`/paciente/${consultaGuardada.pacienteId}`)}>Crear ficha del paciente</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
