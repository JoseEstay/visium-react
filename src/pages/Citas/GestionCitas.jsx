import { useEffect, useState } from 'react';
import agendarIcon from '../../assets/img/agendar.svg';
import configIcon from '../../assets/img/config.svg';
import filtroIcon from '../../assets/img/filtro.svg';
import imprimirIcon from '../../assets/img/imprimir.svg';
import masIcon from '../../assets/img/mas.svg';
import resumenBackground from '../../assets/img/resumen-dia-background.svg';
import seguimientoIcon from '../../assets/img/seguimiento.svg';
import userIcon from '../../assets/img/user.svg';
import './GestionCitas.css';

const PATIENTS_KEY = 'visium.admin.pacientes';
const CITAS_KEY = 'visium.citas';
const FECHA_DEMO = '2025-10-24';

const formVacio = { rut: '', fecha: FECHA_DEMO, horaInicio: '14:00', horaFin: '14:30', motivo: '' };

function fechaTexto(fecha) {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'full' })
    .format(new Date(`${fecha}T00:00:00`));
}

function fechaISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function sumarMediaHora(horaInicio) {
  const [hora, minutos] = horaInicio.split(':').map(Number);
  return `${String(hora + Math.floor((minutos + 30) / 60)).padStart(2, '0')}:${String((minutos + 30) % 60).padStart(2, '0')}`;
}

export default function GestionCitas() {
  const [mostrarAgenda, setMostrarAgenda] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [form, setForm] = useState(formVacio);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(FECHA_DEMO);
  const [citas, setCitas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CITAS_KEY) || '[]').map((cita) => ({
        ...cita,
        horaInicio: cita.horaInicio || cita.hora,
        horaFin: cita.horaFin || sumarMediaHora(cita.hora),
      }));
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
    .filter((cita) => cita.fecha === fechaSeleccionada)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

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

  const abrirAgenda = (horaInicio = '14:00') => {
    setForm({ ...formVacio, fecha: fechaSeleccionada, horaInicio, horaFin: sumarMediaHora(horaInicio) });
    setMostrarAgenda(true);
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
      cita.fecha === form.fecha &&
      form.horaInicio < cita.horaFin &&
      form.horaFin > cita.horaInicio
    )) {
      alert('Ya existe una cita en ese horario.');
      return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
    const nuevaCita = {
      id: `C-${Date.now()}`,
      pacienteRut: paciente.rut,
      pacienteNombre: paciente.nombre,
      profesional: usuario.nombre || 'Profesional por asignar',
      sucursal: paciente.sucursal,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      motivo: form.motivo.trim(),
      fecha: form.fecha,
      estado: 'Pendiente',
    };
    const actualizadas = [...citas, nuevaCita];
    localStorage.setItem(CITAS_KEY, JSON.stringify(actualizadas));
    setCitas(actualizadas);
    setFechaSeleccionada(form.fecha);
    setMostrarAgenda(false);
    setForm(formVacio);
  };

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <h2>Gestión de Citas</h2>
          <p className="text-capitalize">{fechaTexto(fechaSeleccionada)}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => abrirAgenda()}>
          <img src={agendarIcon} alt="" aria-hidden="true" />
          <span>Agendar Nueva Cita</span>
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
                  className={dia === fecha.getDate() ? 'selected' : citas.some((cita) => cita.fecha === `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`) ? 'has-dot' : ''}
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
              <strong className="total-citas">12 Citas</strong>
            </div>
            <div className="summary-stats">
              <div><strong>8</strong><span>Confirmadas</span></div>
              <div><strong>3</strong><span>Pendientes</span></div>
              <div><strong>1</strong><span>Urgencias</span></div>
            </div>
            <img src={resumenBackground} alt="" className="background-img" />
          </article>
        </aside>

        <section className="agenda-card card" aria-label="Agenda diaria">
          <div className="agenda-header">
            <div className="tabs-title">
              <h3>Agenda Diaria</h3>
              <div className="tabs" aria-label="Vista de agenda">
                <button className="active" type="button">Día</button>
                <button type="button">Semana</button>
              </div>
            </div>
            <div className="card-actions">
              <button className="icon-button filtro-btn" type="button" aria-label="Filtrar agenda">
                <img src={filtroIcon} alt="" aria-hidden="true" />
              </button>
              <button className="icon-button filtro-btn" type="button" aria-label="Imprimir agenda">
                <img src={imprimirIcon} alt="" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="timeline">
            {fechaSeleccionada === FECHA_DEMO && <>
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
              <article className="appointment">
                <div className="appointment-icon">
                  <img src={userIcon} alt="" aria-hidden="true" />
                </div>
                <div>
                  <h4>Sofia Castro Villalba</h4>
                  <p>Consulta Pre-Operatoria</p>
                </div>
                <span className="badge info">Confirmado</span>
                <button className="btn btn-light" type="button">Reagendar</button>
                <button className="btn btn-danger-link" type="button">Cancelar</button>
              </article>
            </div>

            <div className="time-row">
              <time>11:45</time>
              <article className="appointment">
                <div className="appointment-icon">
                  <img src={userIcon} alt="" aria-hidden="true" />
                </div>
                <div>
                  <h4>Marcos Toledo</h4>
                  <p>Glaucoma (OD)</p>
                </div>
                <span className="badge warning">Pendiente</span>
                <button className="btn btn-primary btn-xs" type="button">Confirmar</button>
                <button className="btn btn-danger-link" type="button">Cancelar</button>
              </article>
            </div>
            </>}

            {citasDelDia.map((cita) => (
              <div className="time-row" key={cita.id}>
                <time>{cita.horaInicio}</time>
                <article className="appointment">
                  <div className="appointment-icon">
                    <img src={userIcon} alt="" aria-hidden="true" />
                  </div>
                  <div>
                    <h4>{cita.pacienteNombre}</h4>
                    <p>{cita.motivo}</p>
                    <small>{cita.horaInicio}–{cita.horaFin} · {cita.profesional}</small>
                  </div>
                  <span className="badge warning">{cita.estado}</span>
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
        </section>
      </section>

      {mostrarAgenda && (
        <div className="citas-modal" onClick={() => setMostrarAgenda(false)}>
          <form className="citas-modal-card" onSubmit={guardarCita} onClick={(evento) => evento.stopPropagation()}>
            <div className="citas-modal-header">
              <h2>Agendar nueva cita</h2>
              <button type="button" onClick={() => setMostrarAgenda(false)} aria-label="Cerrar">&times;</button>
            </div>

            <label className="citas-campo">
              Paciente
              <div className="citas-lista-pacientes" role="listbox" aria-label="Listado de pacientes">
                {pacientes.map((paciente) => (
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
              Día
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(evento) => setForm({ ...form, fecha: evento.target.value })}
              />
            </label>

            <div className="citas-horario">
              <label className="citas-campo">
                Hora de inicio
                <input
                  type="time"
                  required
                  value={form.horaInicio}
                  onChange={(evento) => setForm({ ...form, horaInicio: evento.target.value })}
                />
              </label>
              <label className="citas-campo">
                Hora de término
                <input
                  type="time"
                  required
                  value={form.horaFin}
                  onChange={(evento) => setForm({ ...form, horaFin: evento.target.value })}
                />
              </label>
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
              <button type="button" className="btn btn-light" onClick={() => setMostrarAgenda(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={!form.rut}>Guardar cita</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
