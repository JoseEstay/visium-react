import './Recetas.css'; // Asegúrate de que el archivo CSS esté en la misma carpeta
import { useEffect } from "react";

const RecetaPage = () => {
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, []);

    return (
        <div className="layout-unificado">
            {/* SIDEBAR */}


            {/* CONTENIDO PRINCIPAL */}
            <div className="contenido-unificado">

                {/* NAVBAR */}


                {/* BREADCRUMB */}
                <div className="breadcrumb-bar">
                    Pacientes / ID: 12455901-K / <span>Nueva Receta</span>
                </div>

                {/* AREA PRINCIPAL */}
                <main className="receta-page">

                    {/* TARJETA PACIENTE */}
                    <section className="paciente-card mb-4">
                        <div className="paciente-info">
                            <div className="foto-paciente">
                                <i className="bi bi-person-circle"></i>
                            </div>
                            <div className="datos-paciente">
                                <h2>Ricardo Mendoza</h2>
                                <p>ID: 12455901-K • 68 Años</p>
                            </div>
                        </div>
                        <div className="diagnostico">
                            <span>Diagnóstico Principal</span>
                            <h4>Glaucoma de Ángulo Abierto / Catarata Senil OD</h4>
                        </div>
                        <div className="ultima-visita">
                            <span>Última Visita</span>
                            <h4>15 Oct 2025</h4>
                        </div>
                        <div className="historial">
                            <button type="button">Ver Historial Completo</button>
                        </div>
                    </section>

                    {/* GRID RECETA */}
                    <section className="contenido-receta d-flex justify-content-center">


                        <div>

                            <div className="receta-card">
                                <div className="titulo-receta">
                                    <h2><i className="fa-solid fa-glasses text-primary"></i> Receta Óptica (Refracción)</h2>
                                    <div className="botones-receta">
                                        <button className="activo" type="button">Lejos</button>
                                        <button type="button">Cerca</button>
                                    </div>
                                </div>

                                <table className="tabla-receta">
                                    <thead>
                                        <tr>
                                            <th>Ojo</th>
                                            <th>Esfera (SPH)</th>
                                            <th>Cilindro (CYL)</th>
                                            <th>Eje (Axis)</th>
                                            <th>Adición (ADD)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>OD (Ojo Derecho)</td>
                                            <td><input type="text" placeholder="-" /></td>
                                            <td><input type="text" placeholder="-0" /></td>
                                            <td><input type="text" placeholder="." /></td>
                                            <td><input type="text" placeholder="+" /></td>
                                        </tr>
                                        <tr>
                                            <td>OI (Ojo Izquierdo)</td>
                                            <td><input type="text" placeholder="-" /></td>
                                            <td><input type="text" placeholder="-0" /></td>
                                            <td><input type="text" placeholder="." /></td>
                                            <td><input type="text" placeholder="+" /></td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="fila-receta pb-2 border-bottom border-light">
                                    <div className="grupo">
                                        <label>Distancia Pupilar (DP)</label>
                                        <div className="input-duo">
                                            <input type="text" placeholder="Lejos (mm)" />
                                            <input type="text" placeholder="Cerca (mm)" />
                                        </div>
                                    </div>
                                    <div className="grupo">
                                        <label>Material Sugerido</label>
                                        <select defaultValue="Policarbonato con Antirreflejo">
                                            <option value="Policarbonato con Antirreflejo">Policarbonato con Antirreflejo</option>
                                            <option value="CR-39">CR-39</option>
                                            <option value="Alto Índice">Alto Índice</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Tarjeta Observaciones */}
                            <div className="receta-card">
                                <div className="grupo mb-0">
                                    <label htmlFor="diagnostico-receta">Diagnóstico</label>
                                    <input
                                        id="diagnostico-receta"
                                        type="text"
                                        placeholder="Ej. Miopía, glaucoma, catarata..."
                                    />
                                    <label className="d-flex align-items-center gap-2 text-dark">
                                        <i className="fa-solid fa-bars-staggered text-muted"></i> Indicaciones Clínicas y Observaciones
                                    </label>
                                    <textarea
                                        rows="4"
                                        className="form-control bg-light text-muted mt-2 border-light"
                                        placeholder="Ej. Uso permanente para lectura, evitar exposición prolongada a pantallas sin filtros..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                    </section>

                    {/* FOOTER / ACCIONES */}
                    <footer className="acciones-footer">
                        <a href="#volver-expediente" className="btn-volver">
                            <i className="fa-solid fa-arrow-left"></i> Volver al Expediente
                        </a>
                        <div className="acciones-botones">
                            <button type="button" className="btn-guardar">Guardar Borrador</button>
                            <button type="button" className="btn-imprimir">
                                <i className="fa-solid fa-paper-plane"></i> Emitir Receta
                            </button>
                        </div>
                    </footer>

                </main>
            </div>
        </div>
    );
};

export default RecetaPage;
