import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Recetas from "../pages/Recetas/Recetas";
import MainLayout from "../layout/MainLayout";
import HomeLayout from "../layout/HomeLayout";
import Home from "../pages/Home/Home";
import NuevoPaciente from "../pages/nuevoPaciente/NuevoPaciente";
import GestionCitas from "../pages/Citas/GestionCitas";
import GestionPacientes from "../pages/gestionPacientes/gestionPacientes";
import NotFound from "../pages/notfound/NotFound";
import RutaProtegida from "../pages/Login/RutaProtegida";
import { ThemeProvider } from "../context/ThemeContext";



export default function AppRouter() {
  return (

    <BrowserRouter>
      <Routes>
        <Route element={<HomeLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        <Route element={<RutaProtegida />}>

          <Route
            element={
              <ThemeProvider>
                <MainLayout />
              </ThemeProvider>
            }>

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/paciente" element={<NuevoPaciente />} />
            <Route path="/gestionPacientes" element={<GestionPacientes />} />
            <Route path="/recetas" element={<Recetas />} />
            <Route path="/citas" element={<GestionCitas />} />
          </Route>

        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/notFound" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/NotFound" replace />} />

      </Routes>

    </BrowserRouter>

  );
}
