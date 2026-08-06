/** Utilidades de formato compartidas por las páginas que consumen la API. */

export const fechaISO = (fecha = new Date()) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
    fecha.getDate(),
  ).padStart(2, "0")}`;

/** Convierte fecha (yyyy-MM-dd) y hora (HH:mm) locales a un Instant ISO-8601 (UTC). */
export const aInstantISO = (fecha, hora = "00:00") =>
  new Date(`${fecha}T${hora}:00`).toISOString();

/** Fecha local (yyyy-MM-dd) de un Instant ISO-8601. */
export const fechaDeInstant = (instant) =>
  instant ? fechaISO(new Date(instant)) : "";

/** Hora local (HH:mm) de un Instant ISO-8601. */
export const horaDeInstant = (instant) =>
  instant
    ? new Date(instant).toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

export const nombreCompleto = (persona) =>
  [persona?.nombre, persona?.apellido].filter(Boolean).join(" ").trim() ||
  "Paciente";
