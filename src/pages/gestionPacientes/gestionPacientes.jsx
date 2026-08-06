import { useState } from 'react';
import { useGestionPacientes } from './useGestionPacientes';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import './gestionPacientes.css';

const SPH = (detalle) => detalle?.esfera ?? '—';
const CYL = (detalle) => detalle?.cilindro ?? '—';
const EJE = (detalle) => detalle?.eje ?? '—';
const buscarDetalle = (receta, ojo) => (receta?.detalles || []).find((detalle) => detalle.ojo === ojo);

export default function GestionPacientes() {
  const navigate = useNavigate();
  const [ultimaReceta, setUltimaReceta] = useState(null);
  const [mostrarOrden, setMostrarOrden] = useState(false);
  // Extraemos toda la lógica y estados de nuestro Custom Hook
  const {
    patients, citasHoy, currentPage, setCurrentPage,
    filterTab, setFilterTab, sortOption, setSortOption, isModalOpen, setIsModalOpen, formData, setFormData,
    contextMenu, editingIndex, filteredPatients, currentPatients, totalPages,
    startRecord, endRecord, handleOpenModal, handleFormSubmit, handleDeletePatient, handleReactivatePatient, handleContextMenu
  } = useGestionPacientes();

  const abrirUltimaReceta = async (paciente) => {
    if (!paciente) return;
    try {
      const recetas = await apiFetch(`/recetas/paciente/${paciente.id}`);
      const recetasOrdenadas = [...(Array.isArray(recetas) ? recetas : [])]
        .sort((a, b) => String(b.fechaEmision || '').localeCompare(String(a.fechaEmision || '')));
      setUltimaReceta({ paciente, receta: recetasOrdenadas[0] || null });
    } catch {
      setUltimaReceta({ paciente, receta: null });
    }
  };

  return (
    <main className="main gestion-pacientes">
      {/* Dashboard */}
      <section className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Gestión de Pacientes</h1>
            <p>Viendo la base de datos central de oftalmología.</p>
          </div>
        </div>

        <div className="cards">
          <div className="card">
            <div className="card-icon blue"><i className="bi bi-people-fill" aria-hidden="true"></i></div>
            <div className="card-info">
              <span>{filterTab === "active" ? "Pacientes activos" : "Total Pacientes"}</span>
              <h2>{filteredPatients.length}</h2>
            </div>
          </div>
          <div className="card">
            <div className="card-icon green"><i className="bi bi-calendar2-check-fill" aria-hidden="true"></i></div>
            <div className="card-info">
              <span>Citas Hoy</span>
              <h2>{citasHoy}</h2>
            </div>
          </div>
        </div>

        {/* 👇 AQUÍ ESTÁ EL CAMBIO: div contenedor de la tabla 👇 */}
        <div className="patients-container">
          <div className="patients-header">
            <div>
              <div className="patients-title">
                <h2>Pacientes</h2>
                <span>{filteredPatients.length} registros</span>
              </div>
              <div className="patient-tabs">
                <button className={`tab ${filterTab === "all" ? "active" : ""}`} onClick={() => { setFilterTab("all"); setCurrentPage(1); }}>
                  Todos
                </button>
                <button className={`tab ${filterTab === "active" ? "active" : ""}`} onClick={() => { setFilterTab("active"); setCurrentPage(1); }}>
                  Activos
                </button>
              </div>
            </div>
            <div className="patients-actions">
              <div className="filter-control">
                <button className="filter-btn" type="button" onClick={() => setMostrarOrden((visible) => !visible)} aria-expanded={mostrarOrden}>
                  <i className="bi bi-funnel"></i> Filtrar
                </button>
                {mostrarOrden && <div className="filter-menu">
                  <label htmlFor="orden-pacientes">Ordenar por</label>
                  <select id="orden-pacientes" value={sortOption} onChange={(event) => { setSortOption(event.target.value); setCurrentPage(1); }}>
                    <option value="nombre-asc">Nombre: A a Z</option>
                    <option value="nombre-desc">Nombre: Z a A</option>
                    <option value="apellido-asc">Apellido: A a Z</option>
                    <option value="apellido-desc">Apellido: Z a A</option>
                    <option value="edad-asc">Edad: menor a mayor</option>
                    <option value="edad-desc">Edad: mayor a menor</option>
                  </select>
                </div>}
              </div>
              <button className="export-btn"><i className="fa-solid fa-file-export"></i> Exportar</button>
            </div>
          </div>

          <div className="patients-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>RUT</th>
                  <th>Última Consulta</th>
                  <th>Diagnóstico</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentPatients.map((p) => {
                  const globalIndex = patients.findIndex(pat => pat.rut === p.rut);
                  return (
                    <tr key={p.rut} className="patient-row">
                      <td className="patient" data-label="Paciente">
                        <img src={p.img} alt={p.nombre} />
                        <div>
                          <strong>{p.nombre}</strong>
                          <small>{p.edad} años · {p.sexo}</small>
                        </div>
                      </td>
                      <td data-label="RUT">{p.rut}</td>
                      <td data-label="Última consulta">{p.consulta}</td>
                      <td data-label="Diagnóstico">
                        <span className={`badge ${p.color}`}>{p.diagnostico || "Sin diagnóstico"}</span>
                      </td>
                      <td data-label="Acciones">
                        <div className="row-actions">
                          {p.estado === "Desactivado" ? (
                            <button className="reactivate-btn" onClick={() => handleReactivatePatient(globalIndex)}>
                              <i className="bi bi-arrow-clockwise"></i> Reactivar
                            </button>
                          ) : <>
                            <button className="recipe-btn" onClick={() => navigate(`/paciente/${p.id}`)}>
                              <i className="bi bi-file-earmark-medical"></i> Crear Receta
                            </button>
                            <button className="menu-btn action-btn" onClick={(e) => handleContextMenu(e, globalIndex)} aria-label="Más opciones">
                              <i className="bi bi-three-dots-vertical"></i>
                            </button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <div className="pagination-info">
              <span>Mostrando {startRecord}-{endRecord} de {filteredPatients.length} pacientes</span>
            </div>
            <div className="pagination-buttons">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} aria-label="Página anterior">
                <i className="bi bi-chevron-left"></i>
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} aria-label="Página siguiente">
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
        {/* 👆 FIN DEL CONTENEDOR 👆 */}

      </section>

      {/* Menú Contextual */}
      {contextMenu.visible && (
        <div className="context-menu show" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => abrirUltimaReceta(patients[contextMenu.patientIndex])}><i className="bi bi-file-earmark-medical"></i> Ver última receta</button>
          <button onClick={() => navigate(`/recetas/historial/${patients[contextMenu.patientIndex]?.id}`)}><i className="bi bi-folder2-open"></i> Ver recetas</button>
          <button onClick={() => handleOpenModal(contextMenu.patientIndex)}><i className="bi bi-person-gear"></i> Editar datos personales</button>
          <button onClick={() => handleDeletePatient(contextMenu.patientIndex)}><i className="bi bi-trash3"></i> Eliminar</button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal show" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingIndex >= 0 ? "Editar datos personales" : "Nuevo paciente"}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Cerrar">&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Nombre completo</label>
                <input type="text" required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label>RUT</label>
                <input type="text" required value={formData.rut} onChange={e => setFormData({ ...formData, rut: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de nacimiento</label>
                  <input type="date" required value={formData.fechaNacimiento} onChange={e => setFormData({ ...formData, fechaNacimiento: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Sexo biológico</label>
                  <select value={formData.sexo} onChange={e => setFormData({ ...formData, sexo: e.target.value })}>
                    <option>Femenino</option>
                    <option>Masculino</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" required value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="save-btn">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ultimaReceta && (
        <div className="modal show" onClick={() => setUltimaReceta(null)}>
          <section className="modal-content ultima-receta-modal" role="dialog" aria-modal="true" aria-labelledby="ultima-receta-titulo" onClick={(evento) => evento.stopPropagation()}>
            <div className="modal-header">
              <div><h2 id="ultima-receta-titulo">Última receta</h2><p>{ultimaReceta.paciente.nombre} · RUT: {ultimaReceta.paciente.rut}</p></div>
              <button type="button" onClick={() => setUltimaReceta(null)} aria-label="Cerrar">&times;</button>
            </div>
            {ultimaReceta.receta ? <div className="ultima-receta-contenido">
              <p className="ultima-receta-fecha">{new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${ultimaReceta.receta.fechaEmision}T00:00:00`))}</p>
              <dl>
                <div><dt>Diagnóstico</dt><dd>{ultimaReceta.receta.indicaciones || 'Sin diagnóstico'}</dd></div>
                <div><dt>Indicaciones</dt><dd>{ultimaReceta.receta.indicaciones || 'Sin indicaciones'}</dd></div>
              </dl>
              <div className="ultima-receta-valores">
                <p><strong>OD</strong> SPH {SPH(buscarDetalle(ultimaReceta.receta, 'OD'))} · CYL {CYL(buscarDetalle(ultimaReceta.receta, 'OD'))} · Eje {EJE(buscarDetalle(ultimaReceta.receta, 'OD'))} · ADD {ultimaReceta.receta.adicion ?? '—'}</p>
                <p><strong>OI</strong> SPH {SPH(buscarDetalle(ultimaReceta.receta, 'OI'))} · CYL {CYL(buscarDetalle(ultimaReceta.receta, 'OI'))} · Eje {EJE(buscarDetalle(ultimaReceta.receta, 'OI'))} · ADD {ultimaReceta.receta.adicion ?? '—'}</p>
                <p><strong>DP</strong> {ultimaReceta.receta.distanciaPupilar ?? '—'} mm</p>
              </div>
            </div> : <div className="ultima-receta-vacia"><i className="bi bi-file-earmark-text" /><p>Este paciente aún no tiene recetas registradas.</p></div>}
          </section>
        </div>
      )}
    </main>
  );
}
