import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './HistorialRecetas.css';

const normalizarTipoVision = (tipoVision) => tipoVision === 'Ambos' ? 'Lejos/Cerca' : (tipoVision || 'Lejos');

export default function HistorialRecetas() {
  const { patientRut } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [recetas, setRecetas] = useState([]);

  useEffect(() => {
    Promise.all([fetch('/data/pacientes.json'), fetch('/data/recetas.json')])
      .then(async ([pacientesResponse, recetasResponse]) => {
        const [pacientes, recetasBase] = await Promise.all([pacientesResponse.json(), recetasResponse.json()]);
        let recetasGuardadas;
        try { recetasGuardadas = JSON.parse(localStorage.getItem('visium.recetas') || '[]'); } catch { recetasGuardadas = []; }
        const recetasPorId = new Map(recetasBase.map((receta) => [receta.id, receta]));
        recetasGuardadas.forEach((receta) => recetasPorId.set(receta.id, receta));
        setPaciente(pacientes.find((item) => item.rut === patientRut) || null);
        setRecetas([...recetasPorId.values()]
          .filter((receta) => receta.pacienteRut === patientRut)
          .sort((a, b) => b.fecha.localeCompare(a.fecha)));
      })
      .catch((error) => console.error('Error cargando historial de recetas', error));
  }, [patientRut]);

  return (
    <main className="historial-recetas-page">
      <Link className="historial-volver" to={`/paciente/${patientRut}`}><i className="bi bi-arrow-left" /> Volver a ficha del paciente</Link>
      <header className="historial-header">
        <div>
          <p>Historial de recetas</p>
          <h1>{paciente?.nombre || 'Paciente no encontrado'}</h1>
          <span>RUT: {patientRut}</span>
        </div>
        <div className="historial-total">{recetas.length} receta{recetas.length === 1 ? '' : 's'}</div>
      </header>

      {recetas.length ? (
        <section className="historial-lista" aria-label="Recetas del paciente">
          {recetas.map((receta) => (
            <article className="historial-receta-card" key={receta.id}>
              <div className="historial-receta-cabecera">
                <div><span>Receta óptica</span><h2>{new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${receta.fecha}T00:00:00`))}</h2></div>
                <div className="historial-graduacion"><span>Graduación</span><span className="historial-tipo">{normalizarTipoVision(receta.tipoVision)}</span></div>
              </div>
              <dl>
                <div><dt>Diagnóstico</dt><dd>{receta.diagnostico || 'Sin diagnóstico'}</dd></div>
                <div><dt>Material</dt><dd>{receta.materialSugerido || 'No especificado'}</dd></div>
                <div><dt>Indicaciones</dt><dd>{receta.indicaciones || 'Sin indicaciones'}</dd></div>
              </dl>
              <div className="historial-valores">
                <div><strong>OD</strong><span>SPH {receta.ojoDerecho?.esfera || '—'} · CYL {receta.ojoDerecho?.cilindro || '—'} · Eje {receta.ojoDerecho?.eje || '—'} · ADD {receta.ojoDerecho?.adicion || '—'}</span></div>
                <div><strong>OI</strong><span>SPH {receta.ojoIzquierdo?.esfera || '—'} · CYL {receta.ojoIzquierdo?.cilindro || '—'} · Eje {receta.ojoIzquierdo?.eje || '—'} · ADD {receta.ojoIzquierdo?.adicion || '—'}</span></div>
                <div><strong>DP</strong><span>Lejos {receta.distanciaPupilar?.lejos || '—'} mm · Cerca {receta.distanciaPupilar?.cerca || '—'} mm</span></div>
              </div>
              {receta.id === recetas[0]?.id && <Link className="historial-editar" to={`/recetas/editar/${receta.id}`}><i className="bi bi-pencil" /> Modificar última receta</Link>}
            </article>
          ))}
        </section>
      ) : <section className="historial-vacio"><i className="bi bi-file-earmark-text" /><h2>Sin recetas registradas</h2><p>Este paciente aún no tiene recetas ópticas asociadas.</p></section>}
    </main>
  );
}
