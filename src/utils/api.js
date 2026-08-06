const API_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname || "localhost"}:8080`;

const EMPRESA_ID_KEY = "empresaActivaId";

export const getEmpresaActivaId = () => localStorage.getItem(EMPRESA_ID_KEY);

export const setEmpresaActivaId = (empresaId) => {
  if (empresaId) {
    localStorage.setItem(EMPRESA_ID_KEY, empresaId);
  } else {
    localStorage.removeItem(EMPRESA_ID_KEY);
  }
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const getToken = () => localStorage.getItem("token");

const parseBody = async (response) => {
  const texto = await response.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
};

const extraerMensaje = (cuerpo, status) => {
  if (!cuerpo) return `Error ${status}`;
  if (typeof cuerpo === "string") return cuerpo;
  if (typeof cuerpo.message === "string") return cuerpo.message;
  if (typeof cuerpo.mensaje === "string") return cuerpo.mensaje;
  if (typeof cuerpo.error === "string") return cuerpo.error;
  if (Array.isArray(cuerpo.messages)) return cuerpo.messages.join(" · ");
  return `Error ${status}`;
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const empresaId = getEmpresaActivaId();

  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (empresaId) {
    headers.set("X-Empresa-Id", empresaId);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioActual");
    setEmpresaActivaId(null);
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Tu sesion expiro. Inicia sesion nuevamente.");
  }

  if (!response.ok) {
    const cuerpo = await parseBody(response);
    throw new ApiError(response.status, extraerMensaje(cuerpo, response.status));
  }

  if (response.status === 204) {
    return null;
  }

  return parseBody(response);
};

export const descargarArchivo = async (endpoint, nombreArchivo) => {
  const token = getToken();
  const empresaId = getEmpresaActivaId();

  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (empresaId) {
    headers.set("X-Empresa-Id", empresaId);
  }

  const response = await fetch(`${API_URL}${endpoint}`, { headers });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioActual");
    setEmpresaActivaId(null);
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Tu sesion expiro. Inicia sesion nuevamente.");
  }

  if (!response.ok) {
    const cuerpo = await parseBody(response);
    throw new ApiError(response.status, extraerMensaje(cuerpo, response.status));
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo || "archivo.pdf";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
};
