import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../utils/api";

/**
 * Consume la API de Visium (envuelve apiFetch).
 * - endpoint: ruta de la API (ej: "/citas")
 * - options: opciones de fetch (body, method...). Se mantiene en una ref para no
 *   disparar re-ejecuciones al re-renderizar el componente.
 * - Devuelve { data, loading, error, refresh }.
 *   refresh() vuelve a ejecutar la petición.
 */
export const useFetch = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!endpoint) return undefined;

    const controller = new AbortController();
    const { signal } = controller;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await apiFetch(endpoint, {
          ...optionsRef.current,
          signal,
        });
        if (!signal.aborted) {
          setData(resultado);
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [endpoint, intento]);

  const refresh = useCallback(() => setIntento((n) => n + 1), []);

  return { data, loading, error, refresh };
};
