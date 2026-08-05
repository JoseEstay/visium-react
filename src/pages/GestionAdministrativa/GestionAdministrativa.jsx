import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import "./GestionAdministrativa.css";

const resources = {
  usuarios: {
    title: "Usuarios",
    fields: ["nombre", "email", "rol", "sucursal"],
    formFields: ["nombre", "email", "password", "rol", "sucursalId"]
  },
  sucursales: { title: "Sucursales", file: "sucursales", fields: ["nombre", "ciudad", "direccion", "telefono"] },
  administradores: { title: "Administradores de sucursal", fields: ["nombre", "email", "sucursal"], formFields: ["nombre", "email", "password", "sucursalId", "sucursal"] },
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
  const navigate = useNavigate();
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
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [resource]);

  useEffect(() => {
    if (!config || !allowed) return;
    let activo = true;
    setRecords([]);
    if (resource === "pacientes") {
      Promise.all([fetch("/data/pacientes.json"), fetch("/data/recetas.json")])
        .then(async ([patientsResponse, recordsResponse]) => {
          if (!patientsResponse.ok || !recordsResponse.ok) throw new Error("No se pudo cargar la información clínica");
          const [patients, fichas] = await Promise.all([patientsResponse.json(), recordsResponse.json()]);
          const fichasPorPaciente = new Map();
          fichas.forEach((ficha) => fichasPorPaciente.set(ficha.pacienteRut, [...(fichasPorPaciente.get(ficha.pacienteRut) || []), ficha]));
          let savedRecords = [];
          try { savedRecords = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch (error) { console.error("Error leyendo pacientes guardados", error); }
          const savedByRut = new Map(savedRecords.map((record) => [record.rut, record]));
          if (!activo) return;
          setRecords(patients.map((patient) => {
            const saved = savedByRut.get(patient.rut) || {};
            const recetas = saved.recetas || fichasPorPaciente.get(patient.rut) || [];
            const ficha = recetas.at(-1) || {};
            return {
              ...patient,
              ...saved,
              id: patient.rut,
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
      return () => { activo = false; };
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
          if (!activo) return;
          setLinkedUsers(users);
          setRecords(scoped.map((item) => ({ ...item, sucursal: branchesById.get(item.sucursalId) || item.sucursal, usuarioEmail: usersById.get(item.usuarioId)?.email || "", usuarioPassword: usersById.get(item.usuarioId)?.password || "" })));
        });
      return () => { activo = false; };
    }
    if (resource === "administradores") {
      Promise.all([fetch("/data/usuarios.json", { cache: "no-store" }), fetch("/data/sucursales.json", { cache: "no-store" })])
        .then(async ([usersResponse, branchesResponse]) => {
          if (!usersResponse.ok || !branchesResponse.ok) throw new Error("No se pudieron cargar los administradores");
          const [baseUsers, branches] = await Promise.all([usersResponse.json(), branchesResponse.json()]);
          let storedUsers = [];
          try { storedUsers = JSON.parse(localStorage.getItem("visium.usuarios") || "[]"); } catch (error) { console.error("Error leyendo usuarios guardados", error); }
          const savedById = new Map(storedUsers.map((item) => [item.id, item]));
          const users = [
            ...baseUsers.map((item) => ({ ...item, ...(savedById.get(item.id) || {}) })),
            ...storedUsers.filter((item) => !baseUsers.some((baseUser) => baseUser.id === item.id))
          ];
          const branchesById = new Map(branches.map((item) => [item.id, item.nombre]));
          const administrators = users
            .filter((item) => item.rol === "administrador sucursal")
            .map((item) => ({ ...item, sucursal: branchesById.get(item.sucursalId) || "Sin sucursal asignada" }));
          if (activo) {
            setLinkedUsers(users);
            setRecords(administrators);
          }
        })
        .catch((error) => console.error("Error cargando administradores de sucursal", error));
      return () => { activo = false; };
    }
    if (resource === "usuarios") {
      Promise.all([fetch("/data/usuarios.json", { cache: "no-store" }), fetch("/data/sucursales.json", { cache: "no-store" })])
        .then(async ([usersResponse, branchesResponse]) => {
          if (!usersResponse.ok || !branchesResponse.ok) throw new Error("No se pudieron cargar los usuarios");
          const [baseUsers, branches] = await Promise.all([usersResponse.json(), branchesResponse.json()]);
          let storedUsers = [];
          try { storedUsers = JSON.parse(localStorage.getItem("visium.usuarios") || "[]"); } catch (error) { console.error("Error leyendo usuarios guardados", error); }
          const savedById = new Map(storedUsers.map((item) => [item.id, item]));
          const users = [
            ...baseUsers.map((item) => ({ ...item, ...(savedById.get(item.id) || {}) })),
            ...storedUsers.filter((item) => !baseUsers.some((baseUser) => baseUser.id === item.id))
          ];
          const branchesById = new Map(branches.map((item) => [item.id, item.nombre]));
          const rolesSinSucursal = ["administrador sucursales", "jefe"];
          if (activo) setRecords(users.map((item) => {
            const sucursalId = rolesSinSucursal.includes(item.rol) ? null : item.sucursalId;
            return { ...item, sucursalId, sucursal: branchesById.get(sucursalId) || "Sin sucursal asignada" };
          }));
        })
        .catch((error) => console.error("Error cargando usuarios", error));
      return () => { activo = false; };
    }
    if (resource === "citas") {
      fetch("/data/citas.json", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : [])
        .then((base) => {
          let citasAgenda = [];
          let citasAdministrativas = [];
          try { citasAgenda = JSON.parse(localStorage.getItem("visium.citas") || "[]"); } catch { citasAgenda = []; }
          try { citasAdministrativas = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { citasAdministrativas = []; }

          const normalizarCita = (cita) => ({
            ...cita,
            paciente: cita.paciente || cita.pacienteNombre || "Paciente",
            pacienteNombre: cita.pacienteNombre || cita.paciente || "Paciente",
            fecha: String(cita.fecha || "").slice(0, 10),
            motivo: cita.motivo || cita.motivoConsulta || "Consulta visual",
          });
          const citasPorId = new Map(base.map((cita) => [cita.id, normalizarCita(cita)]));
          citasAgenda.forEach((cita) => citasPorId.set(cita.id, normalizarCita(cita)));
          citasAdministrativas.forEach((cita) => citasPorId.set(cita.id, normalizarCita(cita)));
          if (activo) setRecords([...citasPorId.values()]);
        })
        .catch((error) => console.error("Error cargando citas", error));
      return () => { activo = false; };
    }
    // Sucursales y profesionales: se toma siempre el JSON base y se superponen
    // cambios locales, evitando que una copia antigua o incompleta oculte registros.
    fetch(`/data/${config.file}.json`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((base) => {
        let guardados = [];
        try { guardados = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { guardados = []; }
        const campoPropio = resource === "sucursales" ? "ciudad" : "especialidad";
        // Descarta registros de otro módulo que hayan quedado en una clave local antigua.
        guardados = guardados.filter((record) => Boolean(record?.[campoPropio]));
        const registrosPorId = new Map(base.map((record) => [record.id, record]));
        guardados.forEach((record) => {
          if (!record?.id) return;
          registrosPorId.set(record.id, { ...(registrosPorId.get(record.id) || {}), ...record });
        });
        if (activo) setRecords([...registrosPorId.values()]);
      })
      .catch((error) => console.error(`Error cargando ${config.title.toLowerCase()}`, error));
    return () => { activo = false; };
  }, [config, allowed, storageKey]);

  useEffect(() => {
    if (records.length) localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  const filtered = useMemo(() => records.filter((record) =>
    Object.values(record).join(" ").toLowerCase().includes(query.toLowerCase())), [records, query]);

  if (!config || !allowed) return <Navigate to="/notFound" replace />;

  const formFields = config.formFields || config.fields;
  const recordIdentifier = (record) => resource === "pacientes" ? record.rut : record.id;
  const openForm = (record = null) => {
    if (record) { setForm({ ...record }); setShowUserPassword(false); return; }
    const branch = user?.sucursalId === "S-001" ? "Visium Santiago Centro" : user?.sucursalId === "S-002" ? "Visium Providencia" : "";
    setForm({ ...(resource === "pacientes" ? {} : { id: `${resource.slice(0, 2).toUpperCase()}-${Date.now()}` }), ...Object.fromEntries(formFields.map((field) => [field, ""])), ...(resource === "recepcionistas" && user?.rol === "administrador sucursal" ? { sucursalId: user.sucursalId, sucursal: branch } : {}) });
    setShowUserPassword(false);
  };
  const save = (event) => {
    event.preventDefault();
    if (resource === "usuarios") {
      const branchNames = { "S-001": "Visium Santiago Centro", "S-002": "Visium Providencia" };
      const rolesSinSucursal = ["administrador sucursales", "jefe"];
      const savedUser = { ...form, sucursalId: rolesSinSucursal.includes(form.rol) ? null : form.sucursalId, sucursal: undefined };
      const branchName = branchNames[savedUser.sucursalId] || "Sin sucursal asignada";
      const updatedUsers = records.some((record) => record.id === savedUser.id)
        ? records.map((record) => record.id === savedUser.id ? { ...savedUser, sucursal: branchName } : record)
        : [...records, { ...savedUser, sucursal: branchName }];
      setRecords(updatedUsers);
      localStorage.setItem("visium.usuarios", JSON.stringify(updatedUsers.map(({ sucursal, ...userRecord }) => userRecord)));
      if (user?.id === savedUser.id) localStorage.setItem("usuarioActual", JSON.stringify(savedUser));
      setForm(null);
      return;
    }
    if (resource === "recepcionistas" || resource === "administradores") {
      const userId = form.usuarioId || `U-${Date.now()}`;
      const isReceptionist = resource === "recepcionistas";
      const branchId = isReceptionist && user.rol === "administrador sucursal" ? user.sucursalId : form.sucursalId;
      const userRecord = isReceptionist
        ? { id: userId, nombre: form.nombre, email: form.usuarioEmail, password: form.usuarioPassword, rol: "recepcionista", sucursalId: branchId }
        : { id: userId, nombre: form.nombre, email: form.email, password: form.password, rol: "administrador sucursal", sucursalId: branchId };
      const updatedUsers = linkedUsers.some((item) => item.id === userId) ? linkedUsers.map((item) => item.id === userId ? { ...item, ...userRecord } : item) : [...linkedUsers, userRecord];
      setLinkedUsers(updatedUsers);
      localStorage.setItem("visium.usuarios", JSON.stringify(updatedUsers));
      const savedRecord = isReceptionist ? { ...form, sucursalId: branchId, usuarioId: userId, email: form.usuarioEmail } : { ...userRecord, sucursal: form.sucursal || "Sin sucursal asignada" };
      setRecords((current) => current.some((record) => record.id === savedRecord.id) ? current.map((record) => record.id === savedRecord.id ? savedRecord : record) : [...current, savedRecord]);
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
        id: form.ficha?.id || `R-${form.rut}`,
        pacienteRut: form.rut,
        diagnostico: form.diagnostico,
        motivoConsulta: form.ficha?.motivoConsulta ?? ""
      }
    } : form;
    setRecords((current) => current.some((record) => recordIdentifier(record) === recordIdentifier(savedForm)) ? current.map((record) => recordIdentifier(record) === recordIdentifier(savedForm) ? savedForm : record) : [...current, savedForm]);
    setForm(null);
  };
  const remove = (id) => {
    const target = records.find((record) => recordIdentifier(record) === id);
    if (!target) return;
    setRecordToDelete(target);
    setDeletePassword("");
    setDeleteError("");
  };
  const confirmDeletion = (event) => {
    event.preventDefault();
    if (!recordToDelete) return;
    const requiredPassword = resource === "administradores" ? recordToDelete.password : user?.password;
    if (!requiredPassword || deletePassword !== requiredPassword) {
      setDeleteError("La contraseña no coincide.");
      return;
    }
    const target = recordToDelete;
    if (resource === "recepcionistas" && target?.usuarioId) {
      const updatedUsers = linkedUsers.filter((item) => item.id !== target.usuarioId);
      setLinkedUsers(updatedUsers);
      localStorage.setItem("visium.usuarios", JSON.stringify(updatedUsers));
    }
    if (resource === "administradores" || resource === "usuarios") {
      const updatedUsers = linkedUsers.filter((item) => item.id !== target.id);
      if (resource === "usuarios") {
        const usersWithoutTarget = records.filter((record) => record.id !== target.id).map(({ sucursal, ...userRecord }) => userRecord);
        localStorage.setItem("visium.usuarios", JSON.stringify(usersWithoutTarget));
      } else {
        setLinkedUsers(updatedUsers);
        localStorage.setItem("visium.usuarios", JSON.stringify(updatedUsers));
      }
    }
    setRecords((current) => current.filter((record) => recordIdentifier(record) !== recordIdentifier(target)));
    setRecordToDelete(null);
  };
  const removeRecipe = (recipeId) => {
    if (!historyPatient) return;
    setRecipeToDelete((historyPatient.recetas || []).find((recipe) => recipe.id === recipeId) || null);
    setDeletePassword("");
    setDeleteError("");
  };
  const confirmRecipeDeletion = (event) => {
    event.preventDefault();
    if (!historyPatient || !recipeToDelete) return;
    if (!user?.password || deletePassword !== user.password) {
      setDeleteError("La contraseña no coincide.");
      return;
    }
    const recipeId = recipeToDelete.id;
    setRecords((current) => current.map((patient) => patient.rut !== historyPatient.rut ? patient : {
      ...patient,
      recetas: (patient.recetas || []).filter((recipe) => recipe.id !== recipeId),
      ficha: (patient.recetas || []).filter((recipe) => recipe.id !== recipeId).at(-1) || {}
    }));
    setHistoryPatient((patient) => ({ ...patient, recetas: (patient.recetas || []).filter((recipe) => recipe.id !== recipeId) }));
    setRecipeToDelete(null);
  };
  const saveRecipe = (event) => {
    event.preventDefault();
    setRecords((current) => current.map((patient) => patient.rut !== historyPatient.rut ? patient : {
      ...patient,
      recetas: (patient.recetas || []).map((recipe) => recipe.id === recipeForm.id ? recipeForm : recipe),
      ficha: recipeForm
    }));
    setHistoryPatient((patient) => ({ ...patient, recetas: (patient.recetas || []).map((recipe) => recipe.id === recipeForm.id ? recipeForm : recipe) }));
    setRecipeForm(null);
  };

  return <section className="admin-page">
    <div className="admin-heading"><div><h1>Gestión Administrativa</h1><p>{config.readOnly ? `${config.title}: consulta los usuarios asignados a cada sucursal.` : resource === "usuarios" ? "Usuarios: administra sus datos, sucursal asignada y roles." : `${config.title}: busca y administra los registros.`}</p></div>{!config.readOnly && <button onClick={() => openForm()}><i className="bi bi-plus-lg" /> Agregar</button>}</div>
    <input className="admin-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${config.title.toLowerCase()}...`} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{config.fields.map((field) => <th key={field}>{label(field)}</th>)}{!config.readOnly && <th>Acciones</th>}</tr></thead><tbody>{filtered.map((record) => <tr key={record.id}>{config.fields.map((field) => <td key={field} data-label={label(field)}>{record[field] || "—"}</td>)}{!config.readOnly && <td data-label="Acciones">{resource === "pacientes" && <button className="icon-action" onClick={() => navigate(`/recetas/historial/${record.rut}`)} aria-label="Ver historial de recetas" title="Ver historial de recetas"><i className="bi bi-clock-history" /></button>}<button className="icon-action" onClick={() => openForm(record)} aria-label="Editar"><i className="bi bi-pencil" /></button><button className="icon-action danger" onClick={() => remove(record.id)} aria-label="Eliminar"><i className="bi bi-trash" /></button></td>}</tr>)}</tbody></table></div>
    {form && <div className="admin-modal" onClick={() => setForm(null)}><form onSubmit={save} onClick={(event) => event.stopPropagation()}><div className="modal-title"><h2>{records.some((record) => record.id === form.id) ? "Modificar" : "Agregar"} {config.title.slice(0, -1)}</h2><button type="button" onClick={() => setForm(null)}>&times;</button></div>{formFields.filter((field) => !(field === "sucursalId" && resource === "usuarios" && ["administrador sucursales", "jefe"].includes(form.rol))).map((field) => <label key={field}>{field === "sucursalId" && resource === "usuarios" ? "Sucursal" : label(field)}{field === "rol" && resource === "usuarios" ? <select required value={form.rol} onChange={(event) => setForm({ ...form, rol: event.target.value, sucursalId: ["administrador sucursales", "jefe"].includes(event.target.value) ? null : form.sucursalId })}><option value="">Selecciona un rol</option>{["administrador sucursales", "administrador sucursal", "jefe", "profesional", "recepcionista"].map((role) => <option key={role} value={role}>{label(role)}</option>)}</select> : field === "sucursalId" && resource === "usuarios" ? <select value={form.sucursalId || ""} onChange={(event) => setForm({ ...form, sucursalId: event.target.value || null })}><option value="">Sin sucursal asignada</option><option value="S-001">Visium Santiago Centro</option><option value="S-002">Visium Providencia</option></select> : field === "usuarioPassword" || ((resource === "administradores" || resource === "usuarios") && field === "password") ? <span className="password-field"><input required type={showUserPassword ? "text" : "password"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /><button type="button" onClick={() => setShowUserPassword((visible) => !visible)} aria-label={showUserPassword ? "Ocultar contraseña" : "Mostrar contraseña"}><i className={`bi bi-eye${showUserPassword ? "-slash" : ""}`} /></button></span> : <input required disabled={resource === "recepcionistas" && user.rol === "administrador sucursal" && (field === "sucursalId" || field === "sucursal")} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />}</label>)}<button className="save" type="submit">Guardar</button></form></div>}
    {recordToDelete && <div className="admin-modal" onClick={() => setRecordToDelete(null)}><form onSubmit={confirmDeletion} onClick={(event) => event.stopPropagation()}><div className="modal-title"><h2>Confirmar eliminación</h2><button type="button" onClick={() => setRecordToDelete(null)}>&times;</button></div><p>{resource === "administradores" ? <>Ingresa la contraseña de <strong>{recordToDelete.nombre}</strong> para eliminar su cuenta.</> : <>¿Deseas eliminar el registro de <strong>{recordToDelete.nombre || recordToDelete.paciente || "este elemento"}</strong>? Ingresa tu contraseña para confirmar.</>}</p><label>Contraseña<input required autoFocus type="password" value={deletePassword} onChange={(event) => { setDeletePassword(event.target.value); setDeleteError(""); }} /></label>{deleteError && <p className="delete-error">{deleteError}</p>}<button className="save danger-save" type="submit">{resource === "administradores" ? "Eliminar administrador" : resource === "usuarios" ? "Eliminar usuario" : "Eliminar registro"}</button></form></div>}
    {recipeToDelete && <div className="admin-modal" onClick={() => setRecipeToDelete(null)}><form onSubmit={confirmRecipeDeletion} onClick={(event) => event.stopPropagation()}><div className="modal-title"><h2>Confirmar eliminación</h2><button type="button" onClick={() => setRecipeToDelete(null)}>&times;</button></div><p>¿Deseas eliminar la receta del <strong>{recipeToDelete.fecha || "historial"}</strong>? Ingresa tu contraseña para confirmar.</p><label>Contraseña<input required autoFocus type="password" value={deletePassword} onChange={(event) => { setDeletePassword(event.target.value); setDeleteError(""); }} /></label>{deleteError && <p className="delete-error">{deleteError}</p>}<button className="save danger-save" type="submit">Eliminar receta</button></form></div>}
    {historyPatient && <div className="admin-modal" onClick={() => { setHistoryPatient(null); setRecipeForm(null); }}><div className="history-modal" style={{ width: "min(680px, 100%)", maxHeight: "calc(100vh - 36px)", overflow: "auto", background: "#fff", borderRadius: 12, padding: 24 }} onClick={(event) => event.stopPropagation()}><div className="modal-title"><h2>Historial de fichas · {historyPatient.nombre}</h2><button type="button" onClick={() => setHistoryPatient(null)}>&times;</button></div>{(historyPatient.recetas || []).length ? <div className="history-list">{historyPatient.recetas.map((recipe) => <article key={recipe.id} className="history-item" style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: 14, marginTop: 12, border: "1px solid #e2e8f0", borderRadius: 9 }}><div><strong>{recipe.fecha || "Sin fecha"}</strong><p>{recipe.diagnostico || "Sin diagnóstico"}</p><small>{recipe.materialSugerido || "Receta óptica"}</small></div><div><button className="icon-action" onClick={() => setRecipeForm({ ...recipe })} aria-label="Editar ficha"><i className="bi bi-pencil" /></button><button className="icon-action danger" onClick={() => removeRecipe(recipe.id)} aria-label="Eliminar ficha"><i className="bi bi-trash" /></button></div></article>)}</div> : <p className="empty-history">Este paciente no tiene fichas registradas.</p>}{recipeForm && <form className="recipe-edit-form" onSubmit={saveRecipe}><label>Fecha<input required type="date" value={recipeForm.fecha || ""} onChange={(event) => setRecipeForm({ ...recipeForm, fecha: event.target.value })} /></label><label>Diagnóstico<input required value={recipeForm.diagnostico || ""} onChange={(event) => setRecipeForm({ ...recipeForm, diagnostico: event.target.value })} /></label><label>Tipo de visión<input required value={recipeForm.tipoVision || "Lejos"} onChange={(event) => setRecipeForm({ ...recipeForm, tipoVision: event.target.value })} /></label><label>Material sugerido<input required value={recipeForm.materialSugerido || ""} onChange={(event) => setRecipeForm({ ...recipeForm, materialSugerido: event.target.value })} /></label><label>Indicaciones<textarea value={recipeForm.indicaciones || ""} onChange={(event) => setRecipeForm({ ...recipeForm, indicaciones: event.target.value })} /></label><button className="save" type="submit">Guardar ficha</button></form>}</div></div>}
  </section>;
}
