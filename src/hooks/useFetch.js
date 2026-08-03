import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export const useFetch = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const result = await apiFetch(endpoint, options);

        setData(result);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, options]);

  return {
    data,
    loading,
    error,
  };
};
