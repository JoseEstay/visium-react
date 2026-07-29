import { Navigate, Outlet } from "react-router";

const rutaProtegida = () => {
    const sesionIniciada = localStorage.getItem("sesionIniciada");

    if (!sesionIniciada) {
        return <Navigate to ="/login" replace />
    }
    return <Outlet />;
};
export default rutaProtegida;