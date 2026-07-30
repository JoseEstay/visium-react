import "./Footer.css";


function Footer() {

    return (

        <footer className="bg-white pt-5 pb-3 border-top footer-custom">

            <div className="container">

                <div className="row gy-4 mb-5">


                    {/* Columna 1: Información Visium */}
                    <div className="col-lg-4 col-md-6">

                        <h4 className="fw-bold text-brand-primary mb-3">
                            Visium
                        </h4>


                        <p className="text-muted small pe-lg-4 lh-base">
                            Plataforma especializada en la gestión de fichas clínicas,
                            recetas ópticas e historial de pacientes, diseñada para
                            facilitar el trabajo de profesionales de la salud visual.
                        </p>


                    
                    </div>



                    {/* Columna 2: Servicios */}
                    <div className="col-lg-4 col-md-6">


                        <h5 className="fw-bold mb-3 fs-6">
                            Nuestros servicios
                        </h5>


                        <ul className="list-unstyled footer-links">


                            <li className="mb-2">
                                <a href="#" className="text-muted text-decoration-none small">
                                    Fichas Clínicas
                                </a>
                            </li>


                            <li className="mb-2">
                                <a href="#" className="text-muted text-decoration-none small">
                                    Recetas Ópticas
                                </a>
                            </li>


                            <li className="mb-2">
                                <a href="#" className="text-muted text-decoration-none small">
                                    Gestión de Pacientes
                                </a>
                            </li>



                        </ul>


                    </div>




                    {/* Columna 3: Contacto */}
                    <div className="col-lg-4 col-md-6">


                        <h5 className="fw-bold mb-3 fs-6">
                            Contacto
                        </h5>


                        <ul className="list-unstyled text-muted small">


                            <li className="mb-2">
                                <i className="bi bi-geo-alt text-brand-primary me-2"></i>
                                Santiago, Chile
                            </li>


                            <li className="mb-2">
                                <i className="bi bi-telephone text-brand-primary me-2"></i>
                                +56 938475829
                            </li>


                            <li className="mb-2">
                                <i className="bi bi-envelope text-brand-primary me-2"></i>
                                contacto@visium.cl
                            </li>


                            <li className="mb-2">
                                <i className="bi bi-clock text-brand-primary me-2"></i>
                                Lun - Vie: 8am - 6pm
                            </li>


                        </ul>


                    </div>


                </div>




                {/* Copyright */}
                <div className="row pt-4 border-top g-0 align-items-center text-muted small">


                    <div className="col-12 text-center">

                        © 2026 Visium. Todos los derechos reservados.

                    </div>


                </div>


            </div>


        </footer>

    );

}


export default Footer;
