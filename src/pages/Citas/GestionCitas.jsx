import agendarIcon from '../../assets/img/agendar.svg';
import configIcon from '../../assets/img/config.svg';
import filtroIcon from '../../assets/img/filtro.svg';
import imprimirIcon from '../../assets/img/imprimir.svg';
import masIcon from '../../assets/img/mas.svg';
import resumenBackground from '../../assets/img/resumen-dia-background.svg';
import seguimientoIcon from '../../assets/img/seguimiento.svg';
import userIcon from '../../assets/img/user.svg';
import './GestionCitas.css';

// Octubre 2025 empieza en miércoles, por eso el mes arranca con dos días de septiembre.
const diasPreviosDelMes = [29, 30];
const diasDelMes = Array.from({ length: 31 }, (_, indice) => indice + 1);
const marcasDelMes = { 4: "has-dot", 5: "danger-dot", 24: "selected" };

export default function GestionCitas() {
  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <h2>Gestión de Citas</h2>
          <p>Viernes, 24 de Octubre de 2025</p>
        </div>
        <button className="btn btn-primary" type="button">
          <img src={agendarIcon} alt="Calendario agenda" aria-hidden="true" />
          <span>Agendar Nueva Cita</span>
        </button>
      </section>

      <section className="appointments-grid" aria-label="Gestión de agenda">
        <aside className="calendar-column" aria-label="Calendario y resumen">
          <article className="card calendar-card">
            <div className="card-header">
              <h3>Octubre 2025</h3>
              <div className="card-actions">
                <button className="icon-button small" type="button" aria-label="Mes anterior">&lt;</button>
                <button className="icon-button small" type="button" aria-label="Mes siguiente">&gt;</button>
              </div>
            </div>
            <div className="calendar">
              <span>LU</span><span>MA</span><span>MI</span><span>JU</span><span>VI</span><span>SA</span><span>DO</span>
              {diasPreviosDelMes.map((dia) => (
                <button className="muted" type="button" key={`previo-${dia}`}>{dia}</button>
              ))}
              {diasDelMes.map((dia) => (
                <button className={marcasDelMes[dia]} type="button" key={dia}>{dia}</button>
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
            <img src={resumenBackground} alt="resumen del dia" className="background-img" />
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
                <img src={filtroIcon} alt="filtrar" aria-hidden="true" />
              </button>
              <button className="icon-button filtro-btn" type="button" aria-label="Imprimir agenda">
                <img src={imprimirIcon} alt="imprimir" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="timeline">
            <div className="time-row">
              <time>08:00</time>
              <article className="appointment completed">
                <div className="appointment-icon">
                  <img src={userIcon} alt="usuario" aria-hidden="true" />
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
                  <img src={seguimientoIcon} alt="seguimiento" aria-hidden="true" />
                </div>
                <div>
                  <h4>Javier Ruiz Gomez</h4>
                  <p>Seguimiento de Glaucoma</p>
                </div>
                <span className="badge primary">En progreso</span>
                <button className="icon-button small" type="button" aria-label="Mas opciones">
                  <img src={configIcon} alt="tres puntos" aria-hidden="true" />
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
                  <img src={userIcon} alt="user" aria-hidden="true" />
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

            <div className="time-row break-row">
              <time>13:00</time>
              <div className="break-line">
                <span>Almuerzo / Descanso</span>
              </div>
            </div>

            <div className="time-row">
              <time>14:00</time>
              <button className="empty-slot" type="button">
                <img src={masIcon} alt="mas" aria-hidden="true" />
                <span>Disponible para cita</span>
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}