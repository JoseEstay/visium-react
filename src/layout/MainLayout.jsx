import MenuLateral from "../components/MenuLateral/MenuLateral";
import { Outlet, useLocation } from "react-router-dom";
import "./MainLayout.css"; // Importa los estilos del layout
import HeaderMenu from "../components/HeaderMenu/HeaderMenu";

export default function MainLayout() {
  const location = useLocation();
  
  return (
    <div className="layout-container">
      {/* Columna Izquierda: Menú Lateral Fijo */}
      <MenuLateral />

      {/* Columna Derecha: Vista variable (Outlet) + Footer */}
      <div className="content-wrapper">
        <HeaderMenu /> 
        <main className="main-content">

          <Outlet />
        </main>        
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}
