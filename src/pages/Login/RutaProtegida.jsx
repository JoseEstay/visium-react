import { Navigate, Outlet } from "react-router";

const rutaProtegida = () => {
    const token = localStorage.getItem("token");
    const usuarioActual = localStorage.getItem("usuarioActual");

    if (!token || !usuarioActual) {
        return <Navigate to="/login" replace />
    }
    return <Outlet />;
};
export default rutaProtegida;
