import "./Recetas.css";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const FECHA_REFERENCIA = new Date();

const formVacio = {
  odEsfera: "",
  odCilindro: "",
  odEje: "",
  oiEsfera: "",
  oiCilindro: "",
  oiEje: "",
  adicion: "",
  distanciaPupilar: "",
  indicaciones: "",
};

const RecetaPage = () => {
  const { pacienteId, recetaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const esNuevaReceta = pathname === "/recetas/nueva";
  const pacienteNuevaReceta = location.state?.paciente;
  const [form, setForm] = useState(formVacio);
  const [paciente, setPaciente] = useState(null);
  const [recetaAnterior, setRecetaAnterior] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (esNuevaReceta) {
      if (!pacienteNuevaReceta?.id || !pacienteNuevaReceta?.nombre) {
        navigate("/paciente", { replace: true });
      }
      return;
    }
    if (recetaId && pacienteId) {
      Promise.all([
        apiFetch(`/recetas/paciente/${pacienteId}`),
        apiFetch(`/pacientes/${pacienteId}`),
      ])
        .then(([recetas, datosPaciente]) => {
          const receta = (Array.isArray(recetas) ? recetas : [])
            .find((item) => item.id === recetaId);
          if (!receta) {
            navigate("/paciente", { replace: true });
            return;
          }
          setPaciente(datosPaciente || null);
          const detalle = (ojo) => (receta.detalles || []).find((d) => d.ojo === ojo);
          setRecetaAnterior(receta);
          setForm({
            odEsfera: detalle("OD")?.esfera ?? "",
            odCilindro: detalle("OD")?.cilindro ?? "",
            odEje: detalle("OD")?.eje ?? "",
            oiEsfera: detalle("OI")?.esfera ?? "",
            oiCilindro: detalle("OI")?.cilindro ?? "",
            oiEje: detalle("OI")?.eje ?? "",
            adicion: receta.adicion ?? "",
            distanciaPupilar: receta.distanciaPupilar ?? "",
            indicaciones: receta.indicaciones ?? "",
          });
        })
        .catch(() => navigate("/paciente", { replace: true }));
    }
  }, [esNuevaReceta, recetaId, pacienteId, pacienteNuevaReceta, navigate]);

  const pacienteMostrado = esNuevaReceta ? location.state?.paciente : paciente;
  const edad = pacienteMostrado?.fechaNacimiento
    ? Math.max(0, Math.floor(
        (FECHA_REFERENCIA -
          new Date(`${pacienteMostrado.fechaNacimiento}T00:00:00`)) /
          31557600000,
      ))
    : "";
  const fechaReceta = recetaAnterior?.fechaEmision
    ? new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${recetaAnterior.fechaEmision}T00:00:00`))
    : "";

  const emitirReceta = async (event) => {
    event.preventDefault();
    if (!pacienteMostrado?.id) {
      setMensaje("No hay un paciente asociado a la receta.");
      return;
    }
    setMensaje("");
    setGuardando(true);
    try {
      const consultasPaciente = await apiFetch(`/consultas/paciente/${pacienteMostrado.id}`);
      const ultimaConsulta = (Array.isArray(consultasPaciente) ? consultasPaciente : [])[0];
      if (!ultimaConsulta) {
        setMensaje("El paciente no tiene consultas registradas. Registra primero una consulta (cerrar cita) para poder emitir la receta.");
        return;
      }
      await apiFetch("/recetas", {
        method: "POST",
        body: JSON.stringify({
          consulta: ultimaConsulta.id,
          adicion: form.adicion ? Number(form.adicion) : null,
          distanciaPupilar: form.distanciaPupilar ? Number(form.distanciaPupilar) : null,
          indicaciones: form.indicaciones.trim() || null,
          detalles: [
            { ojo: "OD", esfera: form.odEsfera ? Number(form.odEsfera) : null, cilindro: form.odCilindro ? Number(form.odCilindro) : null, eje: form.odEje ? Number(form.odEje) : null },
            { ojo: "OI", esfera: form.oiEsfera ? Number(form.oiEsfera) : null, cilindro: form.oiCilindro ? Number(form.oiCilindro) : null, eje: form.oiEje ? Number(form.oiEje) : null },
          ],
        }),
      });
      setMensaje("Receta emitida correctamente.");
      if (pacienteMostrado.id) {
        navigate(`/recetas/historial/${pacienteMostrado.id}`, { replace: true });
      }
    } catch (error) {
      setMensaje(error.message || "No se pudo emitir la receta.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="layout-unificado">
      <div className="contenido-unificado">
        <div className="breadcrumb-bar">
          <span>
            Paciente / ID:{" "}
            {pacienteMostrado?.rut || pacienteMostrado?.id ||
              (esNuevaReceta ? "Sin paciente asociado" : "Cargando...")}{" "}
            / <span>{esNuevaReceta ? "Nueva Receta" : "Editar Receta"}</span>
          </span>
          {pacienteMostrado?.id && (
            <Link
              className="receta-volver-paciente"
              to={`/paciente/${pacienteMostrado.id}`}
            >
              <i className="bi bi-person-vcard" /> Volver a datos del paciente
            </Link>
          )}
        </div>

        <main className="receta-page" key={recetaId || "cargando"}>
          <section className="paciente-card mb-4">
            <div className="paciente-info">
              <div className="foto-paciente">
                <i className="bi bi-person-circle"></i>
              </div>
              <div className="datos-paciente">
                <h2>
                  {pacienteMostrado?.nombre ||
                    (esNuevaReceta ? "Nuevo paciente" : "Cargando paciente...")}
                </h2>
                <p>
                  ID: {pacienteMostrado?.rut || pacienteMostrado?.id || "—"}
                  {edad ? ` • ${edad} Años` : ""}
                </p>
              </div>
            </div>
            <div className="diagnostico">
              <span>Indicaciones Anteriores</span>
              <h4>{recetaAnterior?.indicaciones || "—"}</h4>
            </div>
            <div className="ultima-visita">
              <span>Última Receta</span>
              <h4>{recetaAnterior ? fechaReceta : "—"}</h4>
            </div>
            {recetaAnterior && pacienteMostrado?.id && (
              <div className="historial">
                <Link to={`/recetas/historial/${pacienteMostrado.id}`}>
                  Ver historial recetas
                </Link>
              </div>
            )}
          </section>

          <section className="contenido-receta d-flex justify-content-center">
            <form onSubmit={emitirReceta}>
              <div className="receta-card">
                <div className="titulo-receta">
                  <h2>
                    <i className="fa-solid fa-glasses text-primary"></i> Receta
                    Óptica (Refracción)
                  </h2>
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
                      <td>
                        <input
                          type="text"
                          value={form.odEsfera}
                          onChange={(evento) => setForm({ ...form, odEsfera: evento.target.value })}
                          placeholder="-"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={form.odCilindro}
                          onChange={(evento) => setForm({ ...form, odCilindro: evento.target.value })}
                          placeholder="-0"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={form.odEje}
                          onChange={(evento) => setForm({ ...form, odEje: evento.target.value })}
                          placeholder="."
                        />
                      </td>
                      <td
                        rowSpan={2}
                        style={{ verticalAlign: "middle", textAlign: "center" }}
                      >
                        <input
                          type="text"
                          value={form.adicion}
                          onChange={(evento) => setForm({ ...form, adicion: evento.target.value })}
                          placeholder="+"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>OI (Ojo Izquierdo)</td>
                      <td>
                        <input
                          type="text"
                          value={form.oiEsfera}
                          onChange={(evento) => setForm({ ...form, oiEsfera: evento.target.value })}
                          placeholder="-"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={form.oiCilindro}
                          onChange={(evento) => setForm({ ...form, oiCilindro: evento.target.value })}
                          placeholder="-0"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={form.oiEje}
                          onChange={(evento) => setForm({ ...form, oiEje: evento.target.value })}
                          placeholder="."
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="fila-receta pb-2">
                  <div className="grupo">
                    <label>Distancia Pupilar (DP)</label>
                    <div className="input-duo">
                      <input
                        type="text"
                        value={form.distanciaPupilar}
                        onChange={(evento) => setForm({ ...form, distanciaPupilar: evento.target.value })}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="receta-card">
                <div className="grupo mb-0">
                  <label>Indicaciones Clínicas y Observaciones</label>
                  <textarea
                    rows="4"
                    className="form-control mt-2"
                    value={form.indicaciones}
                    onChange={(evento) => setForm({ ...form, indicaciones: evento.target.value })}
                    placeholder="Ej. Uso permanente para lectura, evitar exposición prolongada a pantallas sin filtros..."
                  />
                </div>
              </div>

              {mensaje && <p className="receta-mensaje" role="status">{mensaje}</p>}

              <footer className="acciones-footer">
                <div className="acciones-botones">
                  <button type="submit" className="btn-imprimir" disabled={guardando}>
                    <i className="fa-solid fa-paper-plane"></i> {guardando ? "Emitiendo..." : "Emitir Receta"}
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
};

export default RecetaPage;
