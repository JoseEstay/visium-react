import { useState, useEffect, useMemo, useCallback } from "react";
import { useFetch } from "../../hooks/useFetch";
import { apiFetch, getEmpresaActivaId } from "../../utils/api";

const emptyPersonalData = {
  nombre: "",
  rut: "",
  fechaNacimiento: "",
  sexo: "",
  telefono: "",
  email: ""
};

function calculateAge(fechaNacimiento, fallbackAge = "") {
  if (!fechaNacimiento) return fallbackAge;

  const birthDate = new Date(`${fechaNacimiento}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return fallbackAge;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPending =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (birthdayPending) age -= 1;
  return age;
}

function normalizePatient(patient) {
  return {
    ...patient,
    id: patient.id,
    nombre: `${patient.nombre || ""} ${patient.apellido || ""}`.trim() || "Paciente",
    rut: patient.numeroDocumento || "",
    edad: calculateAge(patient.fechaNacimiento),
    sexo: patient.sexo ? patient.sexo.charAt(0) + patient.sexo.slice(1).toLowerCase() : "No informa",
    telefono: patient.telefono ?? "",
    email: patient.email ?? "",
    consulta: "—",
    diagnostico: "Sin diagnóstico",
    condicion: "Sin diagnóstico",
    estado: patient.activo === false ? "Desactivado" : "Activo",
    color: "blue",
    img: "https://i.pravatar.cc/150?u=" + patient.id,
  };
}

function fechaActualISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

export function useGestionPacientes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterTab, setFilterTab] = useState("all");
  const [sortOption, setSortOption] = useState("nombre-asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [formData, setFormData] = useState(emptyPersonalData);
  const [saving, setSaving] = useState(false);

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, patientIndex: -1 });
  const rowsPerPage = 10;

  const { data: pacientesApi, refresh: refrescarPacientes } = useFetch("/pacientes?page=0&size=200");
  const { data: citasApi, refresh: refrescarCitas } = useFetch(`/citas?desde=${fechaActualISO()}&hasta=${fechaActualISO()}`);

  const patients = useMemo(
    () =>
      Array.isArray(pacientesApi?.content)
        ? pacientesApi.content.map(normalizePatient)
        : [],
    [pacientesApi],
  );
  const citasHoy = useMemo(
    () => (Array.isArray(citasApi) ? citasApi.length : 0),
    [citasApi],
  );

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setContextMenu({ ...contextMenu, visible: false });
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  const apellido = (nombre = "") => nombre.trim().split(/\s+/).at(-1) || "";
  const [sortField, sortDirection] = sortOption.split("-");
  const filteredPatients = useMemo(() => {
    const collatorLocal = new Intl.Collator("es", { sensitivity: "base" });
    const lista = patients.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rut.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTab = filterTab === "all" ? true : p.estado !== "Desactivado";
      return matchSearch && matchTab;
    });
    return [...lista].sort((first, second) => {
      const firstValue = sortField === "edad" ? Number(first.edad) || 0 : sortField === "apellido" ? apellido(first.nombre) : first.nombre;
      const secondValue = sortField === "edad" ? Number(second.edad) || 0 : sortField === "apellido" ? apellido(second.nombre) : second.nombre;
      const comparison = typeof firstValue === "number" ? firstValue - secondValue : collatorLocal.compare(firstValue, secondValue);
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [patients, searchQuery, filterTab, sortField, sortDirection]);

  // Lógica de Paginación
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / rowsPerPage));
  const start = (currentPage - 1) * rowsPerPage;
  const currentPatients = filteredPatients.slice(start, start + rowsPerPage);
  const startRecord = filteredPatients.length === 0 ? 0 : start + 1;
  const endRecord = Math.min(start + rowsPerPage, filteredPatients.length);

  // Manejadores de eventos
  const handleOpenModal = (index = -1) => {
    setEditingIndex(index);
    if (index >= 0) {
      const p = patients[index];
      setFormData({
        nombre: p.nombre,
        rut: p.rut,
        fechaNacimiento: p.fechaNacimiento ?? "",
        sexo: p.sexo,
        telefono: p.telefono ?? "",
        email: p.email ?? ""
      });
    } else {
      setFormData(emptyPersonalData);
    }
    setContextMenu(current => ({ ...current, visible: false }));
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const paciente = editingIndex >= 0 ? patients[editingIndex] : null;
    const cuerpo = {
      empresaId: getEmpresaActivaId(),
      numeroDocumento: formData.rut,
      nombre: formData.nombre.split(" ")[0] || formData.nombre,
      apellido: formData.nombre.split(" ").slice(1).join(" ") || "—",
      fechaNacimiento: formData.fechaNacimiento || null,
      sexo: formData.sexo ? formData.sexo.toUpperCase() : null,
      telefono: formData.telefono,
      email: formData.email,
      activo: true,
    };
    setSaving(true);
    try {
      if (paciente) {
        await apiFetch(`/pacientes/${paciente.id}`, { method: "PUT", body: JSON.stringify(cuerpo) });
      } else {
        await apiFetch("/pacientes", { method: "POST", body: JSON.stringify(cuerpo) });
      }
      refrescarPacientes();
      setIsModalOpen(false);
      setFormData(emptyPersonalData);
    } catch (error) {
      alert(error.message || "No se pudo guardar el paciente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatient = async (index) => {
    if (window.confirm("¿Desea eliminar este paciente?")) {
      const paciente = patients[index];
      try {
        await apiFetch(`/pacientes/${paciente.id}`, { method: "DELETE" });
        refrescarPacientes();
      } catch (error) {
        alert(error.message || "No se pudo eliminar el paciente.");
      }
    }
  };

  const handleReactivatePatient = async (index) => {
    const paciente = patients[index];
    try {
      await apiFetch(`/pacientes/${paciente.id}`, {
        method: "PUT",
        body: JSON.stringify({
          empresaId: getEmpresaActivaId(),
          numeroDocumento: paciente.rut,
          nombre: paciente.nombre.split(" ")[0],
          apellido: paciente.nombre.split(" ").slice(1).join(" ") || "—",
          fechaNacimiento: paciente.fechaNacimiento || null,
          sexo: paciente.sexo ? paciente.sexo.toUpperCase() : null,
          telefono: paciente.telefono,
          email: paciente.email,
          activo: true,
        }),
      });
      refrescarPacientes();
    } catch (error) {
      alert(error.message || "No se pudo reactivar el paciente.");
    }
  };

  const handleContextMenu = (e, index) => {
    e.stopPropagation();

    const buttonRect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 250;
    const menuHeight = 224;
    const viewportPadding = 12;
    const gap = 8;

    const preferredX = buttonRect.right - menuWidth;
    const x = Math.min(
      Math.max(preferredX, viewportPadding),
      window.innerWidth - menuWidth - viewportPadding
    );

    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const preferredY = spaceBelow >= menuHeight + gap
      ? buttonRect.bottom + gap
      : buttonRect.top - menuHeight - gap;
    const y = Math.min(
      Math.max(preferredY, viewportPadding),
      window.innerHeight - menuHeight - viewportPadding
    );

    setContextMenu(current => {
      if (current.visible && current.patientIndex === index) {
        return { ...current, visible: false };
      }

      return { visible: true, x, y, patientIndex: index };
    });
  };

  const refrescar = useCallback(() => {
    refrescarPacientes();
    refrescarCitas();
  }, [refrescarPacientes, refrescarCitas]);

  // Retornamos todo lo que la interfaz (JSX) va a necesitar
  return {
    patients, citasHoy, searchQuery, setSearchQuery, currentPage, setCurrentPage,
    filterTab, setFilterTab, sortOption, setSortOption, isModalOpen, setIsModalOpen, formData, setFormData,
    contextMenu, editingIndex, filteredPatients, currentPatients, totalPages,
    startRecord, endRecord, handleOpenModal, handleFormSubmit, handleDeletePatient, handleReactivatePatient, handleContextMenu,
    saving, refrescar
  };
}
