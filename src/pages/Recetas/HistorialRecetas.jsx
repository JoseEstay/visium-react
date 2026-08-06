import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch, descargarArchivo } from "../../utils/api";
import { fechaDeInstant, nombreCompleto } from "../../utils/formato";
import "./HistorialRecetas.css";

export default function HistorialRecetas() {
  const { pacienteId } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarHistorial = useCallback(() => {
    if (!pacienteId) return;
    Promise.all([
      apiFetch(`/pacientes/${pacienteId}`),
      apiFetch(`/recetas/paciente/${pacienteId}`),
    ])
      .then(([datosPaciente, recetasPaciente]) => {
        setPaciente(datosPaciente || null);
        setRecetas(
          [...(Array.isArray(recetasPaciente) ? recetasPaciente : [])].sort(
            (a, b) => String(b.fechaEmision || "").localeCompare(String(a.fechaEmision || "")),
          ),
        );
      })
      .catch((error) => {
        setPaciente(null);
        setRecetas([]);
        console.error("Error cargando historial de recetas", error);
      })
      .finally(() => setCargando(false));
  }, [pacienteId]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  const descargarPdf = async (recetaId) => {
    try {
      await descargarArchivo(`/recetas/${recetaId}/pdf`, `Receta_${recetaId}.pdf`);
    } catch (error) {
      console.error("Error descargando receta", error);
    }
  };

  const detalle = (receta, ojo) => (receta.detalles || []).find((d) => d.ojo === ojo);

  return (
    <main className="historial-recetas-page">
      <Link className="historial-volver" to={`/paciente/${pacienteId}`}><i className="bi bi-arrow-left" /> Volver a ficha del paciente</Link>
      <header className="historial-header">
        <div>
          <p>Historial de recetas</p>
          <h1>{paciente ? nombreCompleto(paciente) : "Cargando..."}</h1>
          <span>ID: {paciente?.numeroDocumento || pacienteId}</span>
        </div>
        <div className="historial-total">{cargando ? "..." : `${recetas.length} receta${recetas.length === 1 ? "" : "s"}`}</div>
      </header>

      {!cargando && recetas.length ? (
        <section className="historial-lista" aria-label="Recetas del paciente">
          {recetas.map((receta) => {
            const od = detalle(receta, "OD");
            const oi = detalle(receta, "OI");
            return (
              <article className="historial-receta-card" key={receta.id}>
                <div className="historial-receta-cabecera">
                  <div>
                    <span>Receta óptica</span>
                    <h2>{fechaDeInstant(receta.fechaEmision) || "—"}</h2>
                  </div>
                  <div className="historial-graduacion">
                    <span>Graduación</span>
                    <span className="historial-tipo">{receta.vigenciaHasta ? `Vigente hasta ${fechaDeInstant(receta.vigenciaHasta)}` : "Sin vencimiento"}</span>
                  </div>
                </div>
                <dl>
                  <div><dt>Indicaciones</dt><dd>{receta.indicaciones || "Sin indicaciones"}</dd></div>
                  <div><dt>Observaciones</dt><dd>{receta.observaciones || "Sin observaciones"}</dd></div>
                </dl>
                <div className="historial-valores">
                  <div><strong>OD</strong><span>SPH {od?.esfera ?? "—"} · CYL {od?.cilindro ?? "—"} · Eje {od?.eje ?? "—"}</span></div>
                  <div><strong>OI</strong><span>SPH {oi?.esfera ?? "—"} · CYL {oi?.cilindro ?? "—"} · Eje {oi?.eje ?? "—"}</span></div>
                  <div><strong>DP</strong><span>{receta.distanciaPupilar ?? "—"} mm · ADD {receta.adicion ?? "—"}</span></div>
                </div>
                <div className="historial-acciones">
                  {receta.id === recetas[0]?.id && (
                    <Link className="historial-editar" to={`/recetas/editar/${pacienteId}/${receta.id}`}><i className="bi bi-pencil" /> Modificar última receta</Link>
                  )}
                  <button className="historial-descargar" onClick={() => descargarPdf(receta.id)}><i className="bi bi-file-earmark-arrow-down" /> Descargar PDF</button>
                </div>
              </article>
            );
          })}
        </section>
      ) : !cargando ? (
        <section className="historial-vacio"><i className="bi bi-file-earmark-text" /><h2>Sin recetas registradas</h2><p>Este paciente aún no tiene recetas ópticas asociadas.</p></section>
      ) : null}
    </main>
  );
}
