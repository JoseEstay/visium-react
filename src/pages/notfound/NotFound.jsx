import { useNavigate } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        
        <div className="icon-wrapper">
          <i className="bi bi-file-earmark-x-fill"></i>
        </div>

        <h2>Página no encontrada</h2>
        <p>
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        <div className="not-found-actions">
          {/* Botón para volver a la página anterior */}
          <button 
            className="btn-secondary" 
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left"></i> Volver atrás
          </button>

          {/* Botón para ir al Inicio */}
          <button 
            className="btn-primary" 
            onClick={() => navigate("/")}
          >
            <i className="bi bi-house-door-fill"></i> Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}