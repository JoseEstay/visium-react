import { useEffect, useState } from 'react';
import './NuevoPaciente.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch, getEmpresaActivaId } from '../../utils/api';

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

function fechaALocalDate(fecha) {
  if (!fecha) return '';
  const partes = fecha.split('/');
  if (partes.length === 3 && partes[2].length === 4) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return fecha;
}

function cuerpoPaciente(formData) {
  const partes = formData.nombre.trim().split(/\s+/);
  return {
    empresaId: getEmpresaActivaId(),
    numeroDocumento: formData.rut,
    nombre: partes[0] || formData.nombre,
    apellido: partes.slice(1).join(' ') || '—',
    fechaNacimiento: fechaALocalDate(formData.fecha) || null,
    sexo: formData.sexo ? formData.sexo.toUpperCase() : null,
    telefono: formData.telefono,
    email: formData.email,
    activo: true,
  };
}

export default function NuevoPaciente() {
  const { patientRut } = useParams();
  const navigate = useNavigate();
  const selectedPatientId = patientRut || '';
  const [savedMessage, setSavedMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  // ===============================
  // ESTADOS DEL FORMULARIO
  // ===============================
  const [formData, setFormData] = useState(formVacio);

  const [alergias, setAlergias] = useState([]);
  const [alergiaInput, setAlergiaInput] = useState('');

  useEffect(() => {
    let activo = true;
    if (!patientRut) {
      Promise.resolve().then(() => {
        if (!activo) return;
        setFormData(formVacio);
        setAlergias([]);
      });
      return () => { activo = false; };
    }
    apiFetch(`/pacientes/${patientRut}`)
      .then((paciente) => {
        if (!activo) return;
        setFormData({
          nombre: `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim(),
          rut: paciente.numeroDocumento || '',
          fecha: formatearFechaNacimiento(paciente.fechaNacimiento),
          sexo: (paciente.sexo || '').toLowerCase(),
          telefono: paciente.telefono || '',
          email: paciente.email || '',
          diabetes: false,
          hipertension: false,
          glaucoma: false
        });
      })
      .catch(() => {
        if (activo) setFormData(formVacio);
      });
    return () => { activo = false; };
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

  const handleUpdatePatient = async () => {
    const errorValidacion = validarDatosPersonales();
    if (errorValidacion) {
      setSavedMessage(errorValidacion);
      return;
    }
    if (!selectedPatientId) return;
    setSaving(true);
    try {
      await apiFetch(`/pacientes/${selectedPatientId}`, {
        method: 'PUT',
        body: JSON.stringify(cuerpoPaciente(formData)),
      });
      setSavedMessage('Datos y antecedentes actualizados.');
    } catch (error) {
      setSavedMessage(error.message || 'No se pudo actualizar el paciente.');
    } finally {
      setSaving(false);
    }
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

  const handleCrearReceta = async (event) => {
    event.preventDefault();
    const errorValidacion = validarDatosPersonales();
    if (errorValidacion) {
      setSavedMessage(errorValidacion);
      return;
    }
    const paciente = {
      id: selectedPatientId,
      nombre: formData.nombre,
      rut: formData.rut,
      fechaNacimiento: fechaALocalDate(formData.fecha),
    };
    if (!selectedPatientId) {
      setSaving(true);
      try {
        const creado = await apiFetch('/pacientes', {
          method: 'POST',
          body: JSON.stringify(cuerpoPaciente(formData)),
        });
        setSaving(false);
        navigate('/recetas/nueva', { state: { paciente: { ...paciente, id: creado.id } } });
        return;
      } catch (error) {
        setSaving(false);
        setSavedMessage(error.message || 'No se pudo crear el paciente.');
        return;
      }
    }
    navigate('/recetas/nueva', { state: { paciente } });
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
                  <option value="no-informa">Prefiero no contestar</option>
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
              <button type="button" className="btn-secundario" onClick={handleUpdatePatient} disabled={!selectedPatientId || saving}>
                {saving ? 'Guardando...' : 'Actualizar datos'}
              </button>
              {selectedPatientId && <Link to={`/recetas/historial/${selectedPatientId}`} className="btn-secundario">Ver historial recetas</Link>}
              <button onClick={handleCrearReceta} className="btn-primario" disabled={saving}>Crear nueva receta</button>
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
