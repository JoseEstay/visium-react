import { useEffect, useState } from 'react';
import './NuevoPaciente.css';
import { Link, useParams } from 'react-router-dom';

const formVacio = {
  nombre: '', rut: '', fecha: '', sexo: '', telefono: '', email: '',
  diabetes: false, hipertension: false, glaucoma: false
};

function esRutValido(rut) {
  const limpio = rut.replace(/[^\dkK]/g, '').toUpperCase();
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const verificador = limpio.at(-1);
  let suma = 0;
  let multiplicador = 2;
  for (let indice = cuerpo.length - 1; indice >= 0; indice -= 1) {
    suma += Number(cuerpo[indice]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const esperado = 11 - (suma % 11);
  const digito = esperado === 11 ? '0' : esperado === 10 ? 'K' : String(esperado);
  return digito === verificador;
}

function formatearFechaNacimiento(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return fecha || '';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

export default function NuevoPaciente() {
  const { patientRut } = useParams();
  const [patients, setPatients] = useState([]);
  const selectedPatientRut = patientRut || '';
  const [savedMessage, setSavedMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  // ===============================
  // ESTADOS DEL FORMULARIO
  // ===============================
  const [formData, setFormData] = useState(formVacio);

  const [alergias, setAlergias] = useState([]);
  const [alergiaInput, setAlergiaInput] = useState('');

  useEffect(() => {
    Promise.all([fetch('/data/pacientes.json'), fetch('/data/recetas.json')])
      .then(async ([patientsResponse, fichasResponse]) => {
        const [basePatients, baseFichas] = await Promise.all([patientsResponse.json(), fichasResponse.json()]);
        let storedPatients;
        try { storedPatients = JSON.parse(localStorage.getItem('visium.admin.pacientes') || '[]'); } catch { storedPatients = []; }
        const storedByRut = new Map(storedPatients.map((patient) => [patient.rut, patient]));
        const fichasByPatient = new Map();
        baseFichas.forEach((ficha) => fichasByPatient.set(ficha.pacienteRut, [ficha]));
        const loadedPatients = basePatients.map((patient) => {
          const saved = storedByRut.get(patient.rut) || {};
          const fichas = saved.fichas || (saved.ficha ? [saved.ficha] : fichasByPatient.get(patient.rut) || []);
          return {
            ...patient,
            ...saved,
            // Registros creados antes de incorporar estos campos pueden contener cadenas vacías.
            fechaNacimiento: saved.fechaNacimiento || patient.fechaNacimiento,
            email: saved.email || patient.email,
            fichas
          };
        });
        setPatients(loadedPatients);
        const patient = loadedPatients.find((item) => item.rut === patientRut);
        if (!patient) {
          setFormData(formVacio);
          setAlergias([]);
          return;
        }
        const lastRecord = patient.fichas.at(-1) || {};
        const antecedentes = patient.antecedentes || lastRecord.condicionesMedicas || {};
        setFormData({
          nombre: patient.nombre || '', rut: patient.rut || '', fecha: formatearFechaNacimiento(patient.fechaNacimiento), sexo: (patient.sexo || '').toLowerCase(),
          telefono: patient.telefono || '', email: patient.email || '',
          diabetes: antecedentes.diabetes ?? false,
          hipertension: antecedentes.hipertension ?? false,
          glaucoma: antecedentes.glaucoma ?? false
        });
        setAlergias(antecedentes.alergias || lastRecord.alergias || []);
      })
      .catch((error) => console.error('Error cargando la ficha', error));
  }, [patientRut]);

  // ===============================
  // MANEJADORES DE EVENTOS
  // ===============================
  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
    if (id === 'rut' && value.trim()) {
      setFieldErrors((errors) => ({ ...errors, rut: esRutValido(value) ? '' : 'El dígito verificador del RUT no es válido.' }));
    }
  };

  const validarCampo = (campo, valor) => {
    const texto = valor.trim();
    if (campo === 'nombre') return texto.length > 4 ? '' : 'Llena el campo obligatorio con más de 4 caracteres.';
    if (campo === 'rut') return esRutValido(texto) ? '' : 'El dígito verificador del RUT no es válido.';
    if (campo === 'fecha') return /^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/.test(texto) ? '' : 'Formato: dd/mm/aaaa.';
    if (campo === 'sexo') return texto ? '' : 'Selecciona una opción.';
    if (campo === 'telefono') return /^\+?56\s?9\s?\d{4}\s?\d{4}$/.test(texto) ? '' : 'Ingresa un teléfono chileno válido.';
    if (campo === 'email') return /^\S+@\S+\.\S+$/.test(texto) ? '' : 'Ingresa un correo válido.';
    return '';
  };

  const handleFieldBlur = (event) => {
    const { id, value } = event.target;
    setFieldErrors((errors) => ({ ...errors, [id]: validarCampo(id, value) }));
  };

  const agregarAlergia = () => {
    if (alergiaInput.trim()) {
      setAlergias([...alergias, alergiaInput.trim()]);
      setAlergiaInput('');
    }
  };

  const handleAlergiaKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarAlergia();
    }
  };

  const removeAlergia = (indexToRemove) => {
    setAlergias(alergias.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdatePatient = () => {
    const errorValidacion = validarDatosPersonales();
    if (errorValidacion) {
      setSavedMessage(errorValidacion);
      return;
    }
    const patient = patients.find((item) => item.rut === selectedPatientRut);
    if (!patient) return;

    const updatedPatient = {
      ...patient,
      nombre: formData.nombre, rut: formData.rut, fechaNacimiento: formData.fecha, sexo: formData.sexo,
      telefono: formData.telefono, email: formData.email,
      antecedentes: { alergias, diabetes: formData.diabetes, hipertension: formData.hipertension, glaucoma: formData.glaucoma }
    };
    const updatedPatients = patients.map((item) => item.rut === patient.rut ? updatedPatient : item);
    setPatients(updatedPatients);
    localStorage.setItem('visium.admin.pacientes', JSON.stringify(updatedPatients));
    setSavedMessage('Datos y antecedentes actualizados.');
  };

  const validarDatosPersonales = () => {
    if (formData.nombre.trim().length <= 4) return 'Llena el campo obligatorio con más de 4 caracteres.';
    if (!esRutValido(formData.rut.trim())) return 'Ingresa un RUT con dígito verificador válido.';
    if (!/^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/.test(formData.fecha.trim())) return 'Ingresa una fecha válida: dd/mm/aaaa.';
    if (!formData.sexo) return 'Selecciona el sexo biológico.';
    if (!/^\+?56\s?9\s?\d{4}\s?\d{4}$/.test(formData.telefono.trim())) return 'Ingresa un teléfono chileno válido.';
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) return 'Ingresa un correo electrónico válido.';
    return '';
  };

  const handleCrearFicha = (event) => {
    if (selectedPatientRut) return;
    const errorValidacion = validarDatosPersonales();
    if (errorValidacion) {
      event.preventDefault();
      setSavedMessage(errorValidacion);
    }
  };

  const selectedPatient = patients.find((patient) => patient.rut === selectedPatientRut);
  const tieneRecetas = Boolean(selectedPatient?.fichas?.length);
  const datosParaNuevaReceta = {
    paciente: {
      nombre: formData.nombre,
      rut: formData.rut,
      fechaNacimiento: formData.fecha,
    },
    recetaAnterior: selectedPatient?.fichas?.at(-1) || null,
  };

  return (
    <>
      {/* Contenido Principal */}
      <div className="page-body">
        <div className="form-column">

          <section className="form-section">
            <h2>Datos Personales</h2>
            <div className="form-grid">
              <label>Nombre completo
                <input type="text" id="nombre" value={formData.nombre} onChange={handleInputChange} onBlur={handleFieldBlur} placeholder="Ej: Juan Pérez González" minLength="5" required />{fieldErrors.nombre && <small className="field-error">{fieldErrors.nombre}</small>}
              </label>
              <label>RUT
                <input type="text" id="rut" value={formData.rut} onChange={handleInputChange} onBlur={handleFieldBlur} placeholder="12.345.678-9" pattern="\d{1,2}\.\d{3}\.\d{3}-[\dKk]" required />{fieldErrors.rut && <small className="field-error">{fieldErrors.rut}</small>}
              </label>
              <label>Fecha nacimiento
                <input type="text" id="fecha" value={formData.fecha} onChange={handleInputChange} onBlur={handleFieldBlur} placeholder="dd/mm/aaaa" inputMode="numeric" required />{fieldErrors.fecha && <small className="field-error">{fieldErrors.fecha}</small>}
              </label>
              <label>Sexo biológico
                <select id="sexo" value={formData.sexo} onChange={handleInputChange} onBlur={handleFieldBlur} required>
                  <option value="">Seleccionar...</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="no-contestar">Prefiero no contestar</option>
                </select>
                {fieldErrors.sexo && <small className="field-error">{fieldErrors.sexo}</small>}
              </label>
              <label>Teléfono
                <input type="tel" id="telefono" value={formData.telefono} onChange={handleInputChange} onBlur={handleFieldBlur} placeholder="+56 9 1234 5678" required />{fieldErrors.telefono && <small className="field-error">{fieldErrors.telefono}</small>}
              </label>
              <label>Email
                <input type="email" id="email" value={formData.email} onChange={handleInputChange} onBlur={handleFieldBlur} placeholder="paciente@ejemplo.com" required />{fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
              </label>
            </div>
          </section>

          <section className="form-section">
            <h2>Antecedentes</h2>
            <p className="field-label">Alergias conocidas</p>
            <div className="tags" id="tags">
              {alergias.map((alergia, index) => (
                <span key={index} className="tag" onClick={() => removeAlergia(index)}>
                  {alergia} &times;
                </span>
              ))}
            </div>
            <div className="allergy-input-row">
              <input
                type="text"
                id="alergia-input"
                value={alergiaInput}
                onChange={(e) => setAlergiaInput(e.target.value)}
                onKeyDown={handleAlergiaKeyDown}
                placeholder="Agregar alergia..."
              />
              <button type="button" onClick={agregarAlergia} disabled={!alergiaInput.trim()}>Agregar</button>
            </div>

            <p className="field-label">Condiciones médicas</p>
            <div className="checks">
              <label>
                <input type="checkbox" id="diabetes" checked={formData.diabetes} onChange={handleInputChange} /> Diabetes
              </label>
              <label>
                <input type="checkbox" id="hipertension" checked={formData.hipertension} onChange={handleInputChange} /> Hipertensión
              </label>
              <label>
                <input type="checkbox" id="glaucoma" checked={formData.glaucoma} onChange={handleInputChange} /> Glaucoma
              </label>
            </div>
          </section>

          <footer className="action-bar">
            <p className="required-note">* Campos obligatorios</p>
            <div className="action-buttons">
              <button type="button" className="btn-secundario" onClick={handleUpdatePatient} disabled={!selectedPatientRut}>
                Actualizar datos
              </button>
              {tieneRecetas && <Link to={`/recetas/historial/${selectedPatientRut}`} className="btn-secundario">Ver historial recetas</Link>}
              <Link to="/recetas/nueva" state={datosParaNuevaReceta} onClick={handleCrearFicha} className="btn-primario">Crear nueva receta</Link>
            </div>
            {savedMessage && <p className="save-message" role="status">{savedMessage}</p>}
          </footer>
        </div>

        <aside className="panel-lateral">
          <div className="side-card">
            <h3>Últimos Pacientes</h3>
            <p className="patient-item"><strong>Beatriz Mendoza</strong><br />12.456.789-0</p>
            <p className="patient-item"><strong>Carlos Ruiz</strong><br />10.234.567-8</p>
          </div>

          <div className="side-card side-card-blue">
            <h3>Validación Automática</h3>
            <p>El RUT se validará automáticamente al ingresarlo. Verifique el dígito verificador antes de continuar.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
