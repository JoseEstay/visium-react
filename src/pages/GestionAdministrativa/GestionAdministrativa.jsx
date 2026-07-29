import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import "./GestionAdministrativa.css";

const resources = {
  sucursales: { title: "Sucursales", file: "sucursales", fields: ["nombre", "ciudad", "direccion", "telefono"] },
  profesionales: { title: "Profesionales", file: "profesionales", fields: ["nombre", "especialidad", "email", "sucursal"] },
  recepcionistas: { title: "Recepcionistas", file: "recepcionistas", fields: ["nombre", "usuarioEmail", "telefono", "sucursal"], formFields: ["nombre", "usuarioEmail", "usuarioPassword", "telefono", "sucursalId", "sucursal"] },
  citas: { title: "Citas", file: "citas", fields: ["paciente", "profesional", "fecha", "estado", "sucursal"] },
  pacientes: {
    title: "Pacientes y recetas", file: "pacientes",
    fields: ["nombre", "rut", "telefono", "sucursal", "ultimaConsulta", "diagnostico"],
    formFields: ["nombre", "rut", "telefono", "sucursal", "ultimaConsulta", "diagnostico", "alergias", "diabetes", "hipertension", "glaucoma"]
  },
};

const rolePermissions = {
  "administrador sucursales": Object.keys(resources),
  jefe: Object.keys(resources),
  "administrador sucursal": ["profesionales", "recepcionistas", "citas", "pacientes"],
};

const label = (value) => value.charAt(0).toUpperCase() + value.slice(1);

export default function GestionAdministrativa() {
  const { resource = "" } = useParams();
  const config = resources[resource];
  const user = JSON.parse(localStorage.getItem("usuarioActual") || "null");
  const allowed = user && rolePermissions[user.rol]?.includes(resource);
  const storageKey = `visium.admin.${resource}`;
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [historyPatient, setHistoryPatient] = useState(null);
  const [recipeForm, setRecipeForm] = useState(null);
  const [linkedUsers, setLinkedUsers] = useState([]);

  useEffect(() => {
    if (!config || !allowed) return;
    if (resource === "pacientes") {
      Promise.all([fetch("/data/pacientes.json"), fetch("/data/recetas.json")])
        .then(async ([patientsResponse, recordsResponse]) => {
          if (!patientsResponse.ok || !recordsResponse.ok) throw new Error("No se pudo cargar la información clínica");
          const [patients, fichas] = await Promise.all([patientsResponse.json(), recordsResponse.json()]);
          const fichasPorPaciente = new Map();
          fichas.forEach((ficha) => fichasPorPaciente.set(ficha.pacienteId, [...(fichasPorPaciente.get(ficha.pacienteId) || []), ficha]));
          let savedRecords = [];
          try { savedRecords = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch (error) { console.error("Error leyendo pacientes guardados", error); }
          const savedById = new Map(savedRecords.map((record) => [record.id, record]));
          setRecords(patients.map((patient) => {
            const saved = savedById.get(patient.id) || {};
            const recetas = saved.recetas || fichasPorPaciente.get(patient.id) || [];
            const ficha = recetas.at(-1) || {};
            return {
              ...patient,
              ...saved,
              ultimaConsulta: patient.ultimaConsulta,
              ficha,
              recetas,
              diagnostico: saved.diagnostico ?? ficha.diagnostico ?? "",
              motivoConsulta: saved.motivoConsulta ?? patient.motivoConsulta ?? "",
              alergias: saved.alergias ?? patient.antecedentes?.alergias?.join(", ") ?? "",
              diabetes: saved.diabetes ?? (patient.antecedentes?.diabetes ? "Sí" : "No"),
              hipertension: saved.hipertension ?? (patient.antecedentes?.hipertension ? "Sí" : "No"),
              glaucoma: saved.glaucoma ?? (patient.antecedentes?.glaucoma ? "Sí" : "No")
            };
          }));
        })
        .catch((error) => console.error("Error cargando pacientes y recetas", error));
      return;
    }
    if (resource === "recepcionistas") {
      Promise.all([fetch("/data/recepcionistas.json"), fetch("/data/usuarios.json"), fetch("/data/sucursales.json")])
        .then(async ([recepcionistasResponse, usersResponse, branchesResponse]) => {
          const [recepcionistas, baseUsers, branches] = await Promise.all([recepcionistasResponse.json(), usersResponse.json(), branchesResponse.json()]);
          let storedUsers = [];
          try { storedUsers = JSON.parse(localStorage.getItem("visium.usuarios") || "[]"); } catch (error) { console.error("Error leyendo usuarios guardados", error); }
          const storedUsersById = new Map(storedUsers.map((item) => [item.id, item]));
          // Conserva cambios locales y suma usuarios nuevos que hayan sido agregados al JSON base.
          const users = [
            ...baseUsers.map((item) => ({ ...item, ...(storedUsersById.get(item.id) || {}) })),
            ...storedUsers.filter((item) => !baseUsers.some((baseUser) => baseUser.id === item.id))
          ];
          const usersById = new Map(users.map((item) => [item.id, item]));
          const branchesById = new Map(branches.map((item) => [item.id, item.nombre]));
          const scoped = recepcionistas.filter((item) => user.rol !== "administrador sucursal" || item.sucursalId === user.sucursalId);
          setLinkedUsers(users);
          setRecords(scoped.map((item) => ({ ...item, sucursal: branchesById.get(item.sucursalId) || item.sucursal, usuarioEmail: usersById.get(item.usuarioId)?.email || "", usuarioPassword: usersById.get(item.usuarioId)?.password || "" })));
        });
      return;
    }
    const stored = localStorage.getItem(storageKey);
    if (stored) { setRecords(JSON.parse(stored)); return; }
    fetch(`/data/${config.file}.json`).then((response) => response.json()).then(setRecords);
  }, [config, allowed, storageKey]);

  useEffect(() => {
    if (records.length) localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  const filtered = useMemo(() => records.filter((record) =>
    Object.values(record).join(" ").toLowerCase().includes(query.toLowerCase())), [records, query]);

  if (!config || !allowed) return <Navigate to="/notFound" replace />;

  const formFields = config.formFields || config.fields;
  const openForm = (record = null) => {
    if (record) { setForm({ ...record }); return; }
    const branch = user?.sucursalId === "S-001" ? "Visium Santiago Centro" : user?.sucursalId === "S-002" ? "Visium Providencia" : "";
    setForm({ id: `${resource.slice(0, 2).toUpperCase()}-${Date.now()}`, ...Object.fromEntries(formFields.map((field) => [field, ""])), ...(resource === "recepcionistas" && user?.rol === "administrador sucursal" ? { sucursalId: user.sucursalId, sucursal: branch } : {}) });
  };
  const save = (event) => {
    event.preventDefault();
    if (resource === "recepcionistas") {
      const userId = form.usuarioId || `U-${Date.now()}`;
      const branchId = user.rol === "administrador sucursal" ? user.sucursalId : form.sucursalId;
      const userRecord = { id: userId, nombre: form.nombre, email: form.usuarioEmail, password: form.usuarioPassword, rol: "recepcionista", sucursalId: branchId };
      const updatedUsers = linkedUsers.some((item) => item.id === userId) ? linkedUsers.map((item) => item.id === userId ? { ...item, ...userRecord } : item) : [...linkedUsers, userRecord];
      setLinkedUsers(updatedUsers);
      localStorage.setItem("visium.usuarios", JSON.stringify(updatedUsers));
      const receptionRecord = { ...form, sucursalId: branchId, usuarioId: userId, email: form.usuarioEmail };
      setRecords((current) => current.some((record) => record.id === receptionRecord.id) ? current.map((record) => record.id === receptionRecord.id ? receptionRecord : record) : [...current, receptionRecord]);
      setForm(null);
      return;
    }
    const savedForm = resource === "pacientes" ? {
      ...form,
      antecedentes: {
        alergias: form.alergias.split(",").map((value) => value.trim()).filter(Boolean),
        diabetes: form.diabetes === "Sí",
        hipertension: form.hipertension === "Sí",
        glaucoma: form.glaucoma === "Sí"
      },
      ficha: {
        ...(form.ficha || {}),
        id: form.ficha?.id || `F-${form.id}`,
        pacienteId: form.id,
        diagnostico: form.diagnostico,
        motivoConsulta: form.ficha?.motivoConsulta ?? ""
      }
    } : form;
    setRecords((current) => current.some((record) => record.id === savedForm.id) ? current.map((record) => record.id === savedForm.id ? savedForm : record) : [...current, savedForm]);
    setForm(null);
  };
  const remove = (id) => {
    if (!window.confirm("¿Desea eliminar este registro?")) return;
    const target = records.find((record) => record.id === id);
    if (resource === "recepcionistas" && target?.usuarioId) {
      const updatedUsers = linkedUsers.filter((item) => item.id !== target.usuarioId);
      setLinkedUsers(updatedUsers);
      localStorage.setItem("visium.usuarios", JSON.stringify(updatedUsers));
    }
    setRecords((current) => current.filter((record) => record.id !== id));
  };
  const removeRecipe = (recipeId) => {
    if (!historyPatient || !window.confirm("¿Desea eliminar esta ficha del historial?")) return;
    setRecords((current) => current.map((patient) => patient.id !== historyPatient.id ? patient : {
      ...patient,
      recetas: (patient.recetas || []).filter((recipe) => recipe.id !== recipeId),
      ficha: (patient.recetas || []).filter((recipe) => recipe.id !== recipeId).at(-1) || {}
    }));
    setHistoryPatient((patient) => ({ ...patient, recetas: (patient.recetas || []).filter((recipe) => recipe.id !== recipeId) }));
  };
  const saveRecipe = (event) => {
    event.preventDefault();
    setRecords((current) => current.map((patient) => patient.id !== historyPatient.id ? patient : {
      ...patient,
      recetas: (patient.recetas || []).map((recipe) => recipe.id === recipeForm.id ? recipeForm : recipe),
      ficha: recipeForm
    }));
    setHistoryPatient((patient) => ({ ...patient, recetas: (patient.recetas || []).map((recipe) => recipe.id === recipeForm.id ? recipeForm : recipe) }));
    setRecipeForm(null);
  };

  return <section className="admin-page">
    <div className="admin-heading"><div><h1>Gestión Administrativa</h1><p>{config.title}: busca y administra los registros.</p></div><button onClick={() => openForm()}><i className="bi bi-plus-lg" /> Agregar</button></div>
    <input className="admin-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${config.title.toLowerCase()}...`} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{config.fields.map((field) => <th key={field}>{label(field)}</th>)}<th>Acciones</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id}>{config.fields.map((field) => <td key={field} data-label={label(field)}>{record[field] || "—"}</td>)}<td data-label="Acciones">{resource === "pacientes" && <button className="icon-action" onClick={() => setHistoryPatient(record)} aria-label="Ver historial"><i className="bi bi-clock-history" /></button>}<button className="icon-action" onClick={() => openForm(record)} aria-label="Editar"><i className="bi bi-pencil" /></button><button className="icon-action danger" onClick={() => remove(record.id)} aria-label="Eliminar"><i className="bi bi-trash" /></button></td></tr>)}</tbody></table></div>
    {form && <div className="admin-modal" onClick={() => setForm(null)}><form onSubmit={save} onClick={(event) => event.stopPropagation()}><div className="modal-title"><h2>{records.some((record) => record.id === form.id) ? "Modificar" : "Agregar"} {config.title.slice(0, -1)}</h2><button type="button" onClick={() => setForm(null)}>&times;</button></div>{formFields.map((field) => <label key={field}>{label(field)}<input required disabled={resource === "recepcionistas" && user.rol === "administrador sucursal" && (field === "sucursalId" || field === "sucursal")} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></label>)}<button className="save" type="submit">Guardar</button></form></div>}
    {historyPatient && <div className="admin-modal" onClick={() => { setHistoryPatient(null); setRecipeForm(null); }}><div className="history-modal" style={{ width: "min(680px, 100%)", maxHeight: "calc(100vh - 36px)", overflow: "auto", background: "#fff", borderRadius: 12, padding: 24 }} onClick={(event) => event.stopPropagation()}><div className="modal-title"><h2>Historial de fichas · {historyPatient.nombre}</h2><button type="button" onClick={() => setHistoryPatient(null)}>&times;</button></div>{(historyPatient.recetas || []).length ? <div className="history-list">{historyPatient.recetas.map((recipe) => <article key={recipe.id} className="history-item" style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: 14, marginTop: 12, border: "1px solid #e2e8f0", borderRadius: 9 }}><div><strong>{recipe.fecha || "Sin fecha"}</strong><p>{recipe.diagnostico || "Sin diagnóstico"}</p><small>{recipe.materialSugerido || "Receta óptica"}</small></div><div><button className="icon-action" onClick={() => setRecipeForm({ ...recipe })} aria-label="Editar ficha"><i className="bi bi-pencil" /></button><button className="icon-action danger" onClick={() => removeRecipe(recipe.id)} aria-label="Eliminar ficha"><i className="bi bi-trash" /></button></div></article>)}</div> : <p className="empty-history">Este paciente no tiene fichas registradas.</p>}{recipeForm && <form className="recipe-edit-form" onSubmit={saveRecipe}><label>Fecha<input required type="date" value={recipeForm.fecha || ""} onChange={(event) => setRecipeForm({ ...recipeForm, fecha: event.target.value })} /></label><label>Diagnóstico<input required value={recipeForm.diagnostico || ""} onChange={(event) => setRecipeForm({ ...recipeForm, diagnostico: event.target.value })} /></label><label>Tipo de visión<input required value={recipeForm.tipoVision || "Lejos"} onChange={(event) => setRecipeForm({ ...recipeForm, tipoVision: event.target.value })} /></label><label>Material sugerido<input required value={recipeForm.materialSugerido || ""} onChange={(event) => setRecipeForm({ ...recipeForm, materialSugerido: event.target.value })} /></label><label>Indicaciones<textarea value={recipeForm.indicaciones || ""} onChange={(event) => setRecipeForm({ ...recipeForm, indicaciones: event.target.value })} /></label><button className="save" type="submit">Guardar ficha</button></form>}</div></div>}
  </section>;
}
