import { useGestionPacientes } from './useGestionPacientes';
import { useNavigate } from 'react-router-dom';
import './gestionPacientes.css';

export default function GestionPacientes() {
  const navigate = useNavigate();
  // Extraemos toda la lógica y estados de nuestro Custom Hook
  const {
    patients, currentPage, setCurrentPage,
    filterTab, setFilterTab, isModalOpen, setIsModalOpen, formData, setFormData,
    contextMenu, editingIndex, filteredPatients, currentPatients, totalPages,
    startRecord, endRecord, handleOpenModal, handleFormSubmit, handleDeletePatient, handleContextMenu
  } = useGestionPacientes();

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
            <div className="card-icon blue"><i className="fa-solid fa-users"></i></div>
            <div className="card-info">
              <span>Total Pacientes</span>
              <h2>{patients.length}</h2>
            </div>
          </div>
          <div className="card">
            <div className="card-icon green"><i className="fa-regular fa-calendar-check"></i></div>
            <div className="card-info">
              <span>Citas Hoy</span>
              <h2>24</h2>
            </div>
          </div>
          <div className="card">
            <div className="card-icon orange"><i className="fa-solid fa-stethoscope"></i></div>
            <div className="card-info">
              <span>Procedimientos</span>
              <h2>12</h2>
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
              <button className="filter-btn"><i className="fa-solid fa-filter"></i> Filtrar</button>
              <button className="export-btn"><i className="fa-solid fa-file-export"></i> Exportar</button>
            </div>
          </div>

          <div className="patients-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>ID</th>
                  <th>Última Consulta</th>
                  <th>Diagnóstico</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentPatients.map((p) => {
                  const globalIndex = patients.findIndex(pat => pat.id === p.id);
                  return (
                    <tr key={p.id} className="patient-row">
                      <td className="patient" data-label="Paciente">
                        <img src={p.img} alt={p.nombre} />
                        <div>
                          <strong>{p.nombre}</strong>
                          <small>{p.edad} años · {p.sexo}</small>
                        </div>
                      </td>
                      <td data-label="ID">{p.id}</td>
                      <td data-label="Última consulta">{p.consulta}</td>
                      <td data-label="Diagnóstico">
                        <span className={`badge ${p.color}`}>{p.diagnostico || "Sin diagnóstico"}</span>
                      </td>
                      <td data-label="Acciones">
                        <div className="row-actions">
                          <button className="recipe-btn" onClick={() => navigate(`/paciente/${p.id}`)}>
                            <i className="bi bi-file-earmark-medical"></i> Crear Receta
                          </button>
                          <button className="menu-btn action-btn" onClick={(e) => handleContextMenu(e, globalIndex)} aria-label="Más opciones">
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>
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
          <button onClick={() => alert("Prueba: aquí se mostrará la última ficha del paciente.")}><i className="bi bi-file-earmark-medical"></i> Ver última ficha</button>
          <button onClick={() => alert("Prueba: aquí se mostrará el historial de fichas del paciente.")}><i className="bi bi-folder2-open"></i> Ver fichas</button>
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
                <label>RUT (ID)</label>
                <input type="text" required value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} />
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
    </main>
  );
}
