import "./Header.css";
import { useEffect, useState } from "react";



function Header() {
    const [seccionActiva, setSeccionActiva] = useState(() => window.location.hash === "#sobre-nosotros" ? "sobre" : "inicio");

    useEffect(() => {
        const actualizarSeccion = () => {
            const sobreNosotros = document.getElementById("sobre-nosotros");
            if (!sobreNosotros) return;
            setSeccionActiva(window.scrollY >= sobreNosotros.offsetTop - 140 ? "sobre" : "inicio");
        };

        actualizarSeccion();
        window.addEventListener("scroll", actualizarSeccion, { passive: true });
        window.addEventListener("hashchange", actualizarSeccion);
        return () => {
            window.removeEventListener("scroll", actualizarSeccion);
            window.removeEventListener("hashchange", actualizarSeccion);
        };
    }, []);


    return (

        <header className="border-bottom bg-white sticky-top">


            <nav className="navbar navbar-expand-lg navbar-light bg-white py-3 position-relative">


                <div className="container d-flex align-items-center justify-content-between flex-wrap flex-md-nowrap">



                    <a
                        href="/"
                        className="d-flex align-items-center text-decoration-none fw-bold fs-4 logo-text z-3"
                    >

                        <i className="bi bi-eye-fill me-2"></i>

                        Visium

                    </a>





                    <button

                        className="navbar-toggler ms-auto"

                        type="button"

                        data-bs-toggle="collapse"

                        data-bs-target="#navbarNav"

                        aria-controls="navbarNav"

                        aria-expanded="false"

                        aria-label="Toggle navigation"

                    >

                        <span className="navbar-toggler-icon"></span>

                    </button>







                    <div
                        className="collapse navbar-collapse w-100"
                        id="navbarNav"
                    >





                        <ul className="navbar-nav mx-auto text-center my-3 my-md-0 gap-2 gap-md-1">



                            <li className="nav-item">

                                <a
                                    href="/"
                                    className={`nav-link inicio px-3 fw-semibold ${seccionActiva === "inicio" ? "active-link" : ""}`}
                                    onClick={() => setSeccionActiva("inicio")}
                                >

                                    Inicio

                                </a>

                            </li>





                            <li className="nav-item">

                                <a
                                    href="#sobre-nosotros"
                                    className={`nav-link px-3 link-dark fw-semibold ${seccionActiva === "sobre" ? "active-link" : ""}`}
                                    onClick={() => setSeccionActiva("sobre")}
                                >

                                    Sobre Nosotros

                                </a>

                            </li>


                        </ul>








                        <div
                            className="
                            d-flex
                            flex-column
                            flex-md-row
                            gap-2
                            justify-content-center
                            align-items-center
                            pb-3
                            pb-md-0
                            match-buttons
                            "
                        >





                            <a href="/solicitar-demo" className="btn btn-outline-brand fw-semibold text-nowrap">

                                Solicitar Demo

                            </a>







                            <a

                                href="/login"

                                className="btn btn-brand-primary fw-semibold text-nowrap d-inline-block"

                            >

                                Portal Médico

                            </a>





                        </div>





                    </div>





                </div>



            </nav>



        </header>


    );

}



export default Header;
