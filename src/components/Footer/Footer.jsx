import "./Footer.css";


function Footer() {

    return (

        <footer className="bg-white pt-5 pb-3 border-top footer-custom">


            <div className="container">


                <div className="row gy-4 mb-5">


                    <div className="col-lg-3 col-md-6">


                        <h4 className="fw-bold text-brand-primary mb-3">
                            Visium
                        </h4>


                        <p className="text-muted small pe-lg-4 lh-base">

                            La plataforma líder en gestión de fichas clínicas y recetas ópticas.
                            Optimiza el flujo de trabajo de tu consulta y asegura el historial visual
                            de tus pacientes.

                        </p>


                        <div className="d-flex gap-2 mt-3">


                            <a href="#" className="social-icon-btn">

                                <i className="bi bi-globe"></i>

                            </a>


                            <a href="#" className="social-icon-btn">

                                <i className="bi bi-linkedin"></i>

                            </a>


                        </div>


                    </div>



                    <div className="col-lg-3 col-md-6">

                        <h5 className="fw-bold mb-3 fs-6">

                            Branding y propósito corporativo

                        </h5>


                        <ul className="list-unstyled footer-links">


                            <li className="mb-2">
                                <a href="#" className="text-muted text-decoration-none small">
                                    Ficha Clínica Digital
                                </a>
                            </li>


                            <li className="mb-2">
                                <a href="#" className="text-muted text-decoration-none small">
                                    Módulo de Refracción y Recetas
                                </a>
                            </li>


                            <li className="mb-2">
                                <a href="#" className="text-muted text-decoration-none small">
                                    Buscador avanzado de pacientes
                                </a>
                            </li>


                            <li className="mb-2">
                                <a href="#" className="text-muted text-decoration-none small">
                                    Reportes y Estadísticas
                                </a>
                            </li>


                        </ul>


                    </div>




                    <div className="col-lg-3 col-md-6">


                        <h5 className="fw-bold mb-3 fs-6">
                            Soporte y recursos
                        </h5>


                        <ul className="list-unstyled footer-links">


                            <li className="mb-2">
                                <a href="#" className="text-muted text-decoration-none small">
                                    Centro de Ayuda
                                </a>
                            </li>


                            <li className="mb-2">
                                <a href="#" className="text-muted text-decoration-none small">
                                    Canal de soporte
                                </a>
                            </li>


                            <li className="mb-2">
                                <a href="#" className="text-muted text-decoration-none small">
                                    Actualización del sistema
                                </a>
                            </li>


                            <li className="mb-2">
                                <a href="/solicitar-demo" className="text-muted text-decoration-none small">
                                    Agenda una demo
                                </a>
                            </li>


                        </ul>


                    </div>




                    <div className="col-lg-3 col-md-6">


                        <h5 className="fw-bold mb-3 fs-6">
                            Contacto y horarios
                        </h5>


                        <ul className="list-unstyled text-muted small">


                            <li className="mb-2">
                                <i className="bi bi-geo-alt text-brand-primary me-2"></i>
                                En algún lugar del mundo
                            </li>


                            <li className="mb-2">
                                <i className="bi bi-telephone text-brand-primary me-2"></i>
                                +56 938475829
                            </li>


                            <li className="mb-2">
                                <i className="bi bi-clock text-brand-primary me-2"></i>
                                Lun - Vie: 8am - 6pm
                            </li>


                        </ul>


                    </div>


                </div>



                <div className="row pt-4 border-top g-0 align-items-center text-muted small">


                    <div className="col-md-6 text-center text-md-start">

                        © 2026 Visium. Todos los derechos reservados.

                    </div>


                    <div className="col-md-6 text-center text-md-end">


                        <ul className="list-inline mb-0 bottom-links">


                            <li className="list-inline-item me-3">

                                <a href="#" className="text-muted text-decoration-none">
                                    Política de Privacidad
                                </a>

                            </li>


                            <li className="list-inline-item me-3">

                                <a href="#" className="text-muted text-decoration-none">
                                    Términos de Servicio
                                </a>

                            </li>


                            <li className="list-inline-item">

                                <a href="#" className="text-muted text-decoration-none">
                                    Cookies
                                </a>

                            </li>


                        </ul>


                    </div>


                </div>


            </div>


        </footer>

    );

}


export default Footer;
