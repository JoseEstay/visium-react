import { useState, useEffect } from 'react';

const PATIENTS_STORAGE_KEY = "visium.admin.pacientes";
const CITAS_STORAGE_KEY = "visium.citas";
const emptyPersonalData = {
  nombre: "",
  rut: "",
  fechaNacimiento: "",
  sexo: "Femenino",
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
  const ficha = patient.ficha ?? {};
  return {
    ...patient,
    edad: calculateAge(patient.fechaNacimiento, patient.edad),
    consulta: patient.ultimaConsulta ?? patient.consulta ?? "Sin consultas",
    diagnostico: ficha.diagnostico ?? patient.diagnostico ?? "",
    motivoConsulta: patient.motivoConsulta ?? ficha.motivoConsulta ?? "",
    alergias: patient.alergias ?? (ficha.alergias ?? []).join(", "),
    diabetes: patient.diabetes ?? (ficha.condicionesMedicas?.diabetes ? "Sí" : "No"),
    hipertension: patient.hipertension ?? (ficha.condicionesMedicas?.hipertension ? "Sí" : "No"),
    glaucoma: patient.glaucoma ?? (ficha.condicionesMedicas?.glaucoma ? "Sí" : "No"),
    condicion: ficha.diagnostico ?? patient.diagnostico ?? patient.condicion ?? "Sin diagnóstico",
    color: patient.color ?? "blue",
    img: patient.foto ?? patient.img ?? "https://i.pravatar.cc/150?u=" + patient.rut,
    fechaNacimiento: patient.fechaNacimiento ?? "",
    telefono: patient.telefono ?? "",
    email: patient.email ?? ""
  };
}

function fechaActualISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

export function useGestionPacientes() {
  const [patients, setPatients] = useState([]);
  const [citasHoy, setCitasHoy] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterTab, setFilterTab] = useState("all");
  const [sortOption, setSortOption] = useState("nombre-asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [formData, setFormData] = useState(emptyPersonalData);

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, patientIndex: -1 });
  const rowsPerPage = 10;

  // Fuente única: datos de pacientes y fichas. Se conserva en localStorage tras una edición.
  useEffect(() => {
    Promise.all([fetch("/data/pacientes.json"), fetch("/data/recetas.json")])
      .then(async ([patientsResponse, recordsResponse]) => {
        if (!patientsResponse.ok || !recordsResponse.ok) throw new Error("No se pudo cargar la información clínica");
        const [patientData, recordData] = await Promise.all([patientsResponse.json(), recordsResponse.json()]);
        const recordsByPatient = new Map(recordData.map((record) => [record.pacienteRut, record]));
        let savedPatients = [];
        try { savedPatients = JSON.parse(localStorage.getItem(PATIENTS_STORAGE_KEY) || "[]"); } catch (error) { console.error("Error leyendo pacientes guardados", error); }
        const savedByRut = new Map(savedPatients.map((patient) => [patient.rut, patient]));
        setPatients(patientData.map((patient) => {
          const saved = savedByRut.get(patient.rut) || {};
          // El archivo base conserva campos que no existían en versiones anteriores, como última consulta.
          return normalizePatient({
            ...patient,
            ...saved,
            // Conserva los datos válidos editados, pero repara datos antiguos vacíos desde el JSON base.
            fechaNacimiento: saved.fechaNacimiento || patient.fechaNacimiento,
            email: saved.email || patient.email,
            ultimaConsulta: patient.ultimaConsulta,
            ficha: recordsByPatient.get(patient.rut) ?? saved.ficha
          });
        }));
      })
      .catch((error) => console.error("Error cargando pacientes", error));
  }, []);

  useEffect(() => {
    fetch("/data/citas.json", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((citasBase) => {
        let citasGuardadas = [];
        try { citasGuardadas = JSON.parse(localStorage.getItem(CITAS_STORAGE_KEY) || "[]"); } catch { citasGuardadas = []; }

        const citasPorId = new Map(citasBase.map((cita) => [cita.id, cita]));
        citasGuardadas.forEach((cita) => citasPorId.set(cita.id, cita));
        const hoy = fechaActualISO();
        setCitasHoy([...citasPorId.values()].filter((cita) => String(cita.fecha || "").slice(0, 10) === hoy).length);
      })
      .catch((error) => console.error("Error cargando citas", error));
  }, []);

  useEffect(() => {
    if (patients.length) localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setContextMenu({ ...contextMenu, visible: false });
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  // Lógica de filtrado
  let filteredPatients = patients.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rut.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.condicion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = filterTab === "all" ? true : p.estado !== "Desactivado";
    return matchSearch && matchTab;
  });

  const collator = new Intl.Collator("es", { sensitivity: "base" });
  const apellido = (nombre = "") => nombre.trim().split(/\s+/).at(-1) || "";
  const [sortField, sortDirection] = sortOption.split("-");
  filteredPatients = [...filteredPatients].sort((first, second) => {
    const firstValue = sortField === "edad" ? Number(first.edad) || 0 : sortField === "apellido" ? apellido(first.nombre) : first.nombre;
    const secondValue = sortField === "edad" ? Number(second.edad) || 0 : sortField === "apellido" ? apellido(second.nombre) : second.nombre;
    const comparison = typeof firstValue === "number" ? firstValue - secondValue : collator.compare(firstValue, secondValue);
    return sortDirection === "desc" ? -comparison : comparison;
  });

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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    let updatedPatients = [...patients];
    if (editingIndex === -1) {
      updatedPatients.push({
        ...formData,
        edad: calculateAge(formData.fechaNacimiento),
        consulta: "",
        condicion: "Sin diagnóstico",
        color: "blue",
        img: `https://i.pravatar.cc/150?u=${Date.now()}`
      });
    } else {
      updatedPatients[editingIndex] = {
        ...patients[editingIndex],
        ...formData,
        edad: calculateAge(formData.fechaNacimiento, patients[editingIndex].edad)
      };
    }

    setPatients(updatedPatients);
    setIsModalOpen(false);
    setFormData(emptyPersonalData);
  };

  const handleDeletePatient = (index) => {
    if (window.confirm("¿Desea eliminar este paciente?")) {
      const updatedPatients = patients.filter((_, i) => i !== index);
      setPatients(updatedPatients);
    }
  };

  const handleReactivatePatient = (index) => {
    setPatients((current) => current.map((patient, patientIndex) =>
      patientIndex === index ? { ...patient, estado: "Activo" } : patient
    ));
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

  // Retornamos todo lo que la interfaz (JSX) va a necesitar
  return {
    patients, citasHoy, searchQuery, setSearchQuery, currentPage, setCurrentPage,
    filterTab, setFilterTab, sortOption, setSortOption, isModalOpen, setIsModalOpen, formData, setFormData,
    contextMenu, editingIndex, filteredPatients, currentPatients, totalPages,
    startRecord, endRecord, handleOpenModal, handleFormSubmit, handleDeletePatient, handleReactivatePatient, handleContextMenu
  };
}
