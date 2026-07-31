import './Recetas.css'; // Asegúrate de que el archivo CSS esté en la misma carpeta
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

const FECHA_REFERENCIA = new Date('2026-07-31T00:00:00');
const normalizarTipoVision = (tipoVision) => tipoVision === 'Ambos' ? 'Lejos/Cerca' : (tipoVision || 'Lejos');

const RecetaPage = () => {
    const { recetaId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { pathname } = location;
    const esNuevaReceta = pathname === '/recetas/nueva';
    const pacienteNuevaReceta = location.state?.paciente;
    const [receta, setReceta] = useState(null);
    const [paciente, setPaciente] = useState(null);
    const [tipoVision, setTipoVision] = useState('Lejos');

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        if (esNuevaReceta) {
            if (!pacienteNuevaReceta?.rut || !pacienteNuevaReceta?.nombre) navigate('/paciente', { replace: true });
            return;
        }
        Promise.all([fetch('/data/recetas.json'), fetch('/data/pacientes.json')])
            .then(async ([recetasResponse, pacientesResponse]) => {
                const [recetas, pacientes] = await Promise.all([recetasResponse.json(), pacientesResponse.json()]);
                const recetaInicial = recetaId ? recetas.find((item) => item.id === recetaId) : null;
                const pacienteAsociado = pacientes.find((item) => item.rut === recetaInicial?.pacienteRut) || null;
                if (!recetaInicial || !pacienteAsociado) {
                    navigate('/paciente', { replace: true });
                    return;
                }
                setReceta(recetaInicial);
                setTipoVision(normalizarTipoVision(recetaInicial?.tipoVision));
                setPaciente(pacienteAsociado);
            })
            .catch((error) => console.error('Error cargando receta', error));
    }, [esNuevaReceta, recetaId, pacienteNuevaReceta?.nombre, pacienteNuevaReceta?.rut, navigate]);

    const pacienteMostrado = esNuevaReceta ? location.state?.paciente : paciente;
    const recetaAnterior = esNuevaReceta ? location.state?.recetaAnterior : receta;
    const edad = pacienteMostrado?.fechaNacimiento
        ? Math.floor((FECHA_REFERENCIA - new Date(`${pacienteMostrado.fechaNacimiento}T00:00:00`)) / 31557600000)
        : '';
    const fechaReceta = recetaAnterior?.fecha
        ? new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${recetaAnterior.fecha}T00:00:00`))
        : '';

    return (
        <div className="layout-unificado">
            {/* SIDEBAR */}


            {/* CONTENIDO PRINCIPAL */}
            <div className="contenido-unificado">

                {/* NAVBAR */}


                {/* BREADCRUMB */}
                <div className="breadcrumb-bar">
                    <span>Paciente / RUT: {pacienteMostrado?.rut || (esNuevaReceta ? 'Sin paciente asociado' : 'Cargando...')} / <span>Nueva Receta</span></span>
                    {pacienteMostrado?.rut && (
                        <Link className="receta-volver-paciente" to={`/paciente/${pacienteMostrado.rut}`}>
                            <i className="bi bi-person-vcard" /> Volver a datos del paciente
                        </Link>
                    )}
                </div>

                {/* AREA PRINCIPAL */}
                <main className="receta-page" key={receta?.id || 'cargando'}>

                    {/* TARJETA PACIENTE */}
                    <section className="paciente-card mb-4">
                        <div className="paciente-info">
                            <div className="foto-paciente">
                                <i className="bi bi-person-circle"></i>
                            </div>
                            <div className="datos-paciente">
                                <h2>{pacienteMostrado?.nombre || (esNuevaReceta ? 'Nuevo paciente' : 'Cargando paciente...')}</h2>
                                <p>ID: {pacienteMostrado?.rut || '—'}{edad ? ` • ${edad} Años` : ''}</p>
                            </div>
                        </div>
                        <div className="diagnostico">
                            <span>Diagnóstico Principal</span>
                            <h4>{recetaAnterior?.diagnostico || '—'}</h4>
                        </div>
                        <div className="ultima-visita">
                            <span>Última Visita</span>
                            <h4>{recetaAnterior ? fechaReceta : '—'}</h4>
                        </div>
                        {recetaAnterior && pacienteMostrado?.rut && <div className="historial">
                            <Link to={`/recetas/historial/${pacienteMostrado.rut}`}>Ver historial recetas</Link>
                        </div>}
                    </section>

                    {/* GRID RECETA */}
                    <section className="contenido-receta d-flex justify-content-center">


                        <div>

                            <div className="receta-card">
                                <div className="titulo-receta">
                                    <h2><i className="fa-solid fa-glasses text-primary"></i> Receta Óptica (Refracción)</h2>
                                    <label className="tipo-vision-control">Graduación
                                        <select value={tipoVision} onChange={(event) => setTipoVision(event.target.value)}>
                                            <option value="Lejos">Lejos</option>
                                            <option value="Cerca">Cerca</option>
                                            <option value="Lejos/Cerca">Lejos/Cerca</option>
                                        </select>
                                    </label>
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
                                            <td><input type="text" defaultValue={receta?.ojoDerecho?.esfera || ''} placeholder="-" /></td>
                                            <td><input type="text" defaultValue={receta?.ojoDerecho?.cilindro || ''} placeholder="-0" /></td>
                                            <td><input type="text" defaultValue={receta?.ojoDerecho?.eje || ''} placeholder="." /></td>
                                            <td><input type="text" defaultValue={receta?.ojoDerecho?.adicion || ''} placeholder="+" /></td>
                                        </tr>
                                        <tr>
                                            <td>OI (Ojo Izquierdo)</td>
                                            <td><input type="text" defaultValue={receta?.ojoIzquierdo?.esfera || ''} placeholder="-" /></td>
                                            <td><input type="text" defaultValue={receta?.ojoIzquierdo?.cilindro || ''} placeholder="-0" /></td>
                                            <td><input type="text" defaultValue={receta?.ojoIzquierdo?.eje || ''} placeholder="." /></td>
                                            <td><input type="text" defaultValue={receta?.ojoIzquierdo?.adicion || ''} placeholder="+" /></td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="fila-receta pb-2">
                                    <div className="grupo">
                                        <label>Distancia Pupilar (DP)</label>
                                        <div className="input-duo">
                                            <input type="text" defaultValue={receta?.distanciaPupilar?.lejos || ''} placeholder="Lejos (mm)" />
                                            <input type="text" defaultValue={receta?.distanciaPupilar?.cerca || ''} placeholder="Cerca (mm)" />
                                        </div>
                                    </div>
                                    <div className="grupo">
                                        <label>Material Sugerido</label>
                                        <select defaultValue={receta?.materialSugerido || ''}>
                                            <option value="" disabled>Seleccionar material...</option>
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
                                        defaultValue={receta?.diagnostico || ''}
                                        placeholder="Ej. Miopía, glaucoma, catarata..."
                                    />
                                    <label>Indicaciones Clínicas y Observaciones</label>
                                    <textarea
                                        rows="4"
                                        className="form-control mt-2"
                                        defaultValue={receta?.indicaciones || ''}
                                        placeholder="Ej. Uso permanente para lectura, evitar exposición prolongada a pantallas sin filtros..."
                                    />
                                </div>
                            </div>
                        </div>

                    </section>

                    {/* FOOTER / ACCIONES */}
                    <footer className="acciones-footer">
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
