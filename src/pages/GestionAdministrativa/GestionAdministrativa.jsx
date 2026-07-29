import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import "./GestionAdministrativa.css";

const resources = {
  sucursales: { title: "Sucursales", file: "sucursales", fields: ["nombre", "ciudad", "direccion", "telefono"] },
  profesionales: { title: "Profesionales", file: "profesionales", fields: ["nombre", "especialidad", "email", "sucursal"] },
  recepcionistas: { title: "Recepcionistas", file: "recepcionistas", fields: ["nombre", "email", "telefono", "sucursal"] },
  citas: { title: "Citas", file: "citas", fields: ["paciente", "profesional", "fecha", "estado", "sucursal"] },
  pacientes: { title: "Pacientes y fichas", file: "pacientes", fields: ["nombre", "rut", "telefono", "sucursal", "ficha"] },
};

const rolePermissions = {
  "administrador sucursales": Object.keys(resources),
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

  useEffect(() => {
    if (!config || !allowed) return;
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

  const openForm = (record = null) => setForm(record ? { ...record } : { id: `${resource.slice(0, 2).toUpperCase()}-${Date.now()}`, ...Object.fromEntries(config.fields.map((field) => [field, ""])) });
  const save = (event) => {
    event.preventDefault();
    setRecords((current) => current.some((record) => record.id === form.id) ? current.map((record) => record.id === form.id ? form : record) : [...current, form]);
    setForm(null);
  };
  const remove = (id) => window.confirm("¿Desea eliminar este registro?") && setRecords((current) => current.filter((record) => record.id !== id));

  return <section className="admin-page">
    <div className="admin-heading"><div><h1>Gestión Administrativa</h1><p>{config.title}: busca y administra los registros.</p></div><button onClick={() => openForm()}><i className="bi bi-plus-lg" /> Agregar</button></div>
    <input className="admin-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${config.title.toLowerCase()}...`} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{config.fields.map((field) => <th key={field}>{label(field)}</th>)}<th>Acciones</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id}>{config.fields.map((field) => <td key={field}>{record[field]}</td>)}<td><button className="icon-action" onClick={() => openForm(record)} aria-label="Editar"><i className="bi bi-pencil" /></button><button className="icon-action danger" onClick={() => remove(record.id)} aria-label="Eliminar"><i className="bi bi-trash" /></button></td></tr>)}</tbody></table></div>
    {form && <div className="admin-modal" onClick={() => setForm(null)}><form onSubmit={save} onClick={(event) => event.stopPropagation()}><div className="modal-title"><h2>{records.some((record) => record.id === form.id) ? "Modificar" : "Agregar"} {config.title.slice(0, -1)}</h2><button type="button" onClick={() => setForm(null)}>&times;</button></div>{config.fields.map((field) => <label key={field}>{label(field)}<input required value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></label>)}<button className="save" type="submit">Guardar</button></form></div>}
  </section>;
}
