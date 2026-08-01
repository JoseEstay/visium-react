import { Navigate, Outlet } from "react-router";

const rutaProtegida = () => {
    const sesionIniciada = localStorage.getItem("sesionIniciada");
    const usuarioActual = localStorage.getItem("usuarioActual");

    if (sesionIniciada !== "true" || !usuarioActual) {
        return <Navigate to ="/login" replace />
    }
    return <Outlet />;
};
export default rutaProtegida;
