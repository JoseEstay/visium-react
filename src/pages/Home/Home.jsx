import "./Home.css";

import banner from "../../assets/img/img-banner.png";


function Home() {

    return (

        <main className="home-page">


            {/* HERO SECTION */}

            <section id="inicio" className="py-5 my-4">

                <div className="container">

                    <div className="row align-items-center gy-5">


                        <div className="col-lg-6">


                            <div className="mb-3">

                                <span className="badge-brand">

                                    <i className="bi bi-patch-check-fill me-1"></i>

                                    Red Oftalmológica Líder

                                </span>

                            </div>



                            <h1 className="hero-title mb-4">

                                Optimiza la gestión de tu óptica

                                <br />

                                con fichas clínicas digitales

                            </h1>



                            <p className="hero-text mb-4 text-muted">

                                Visium centraliza los datos de tus pacientes, recetas e
                                historial de refracción en una plataforma intuitiva y segura,
                                diseñada exclusivamente para especialistas de la visión.

                            </p>




                            <div
                                className="
                d-flex
                flex-wrap
                align-items-center
                justify-content-center
                justify-content-lg-start
                gap-2
                gap-sm-3
                mb-5
                "
                            >


                                <button
                                    type="button"
                                    className="btn btn-brand-primary px-3 py-2 fw-semibold"
                                >

                                    Contáctanos

                                </button>




                                <button
                                    type="button"
                                    onClick={() => window.location.href = "/login"}
                                    className="btn btn-brand-outline px-3 py-2 d-inline-flex align-items-center gap-2 fw-semibold btn-medico flex-shrink-0"
                                >
                                    Portal Médico
                                    <i className="bi bi-box-arrow-in-right"></i>
                                </button>
                            </div>





                            <div className="row pt-4 border-top g-0">


                                <div className="col-auto pe-4">


                                    <p className="stat-number mb-0">

                                        50%

                                    </p>


                                    <p className="stat-label mb-0 text-muted">

                                        Tiempo ahorrado
                                        <br />
                                        en la consulta

                                    </p>


                                </div>




                                <div className="col-auto ps-4 border-divider">


                                    <p className="stat-number mb-0">

                                        100%

                                    </p>


                                    <p className="stat-label mb-0 text-muted">

                                        Fichas digitales
                                        <br />
                                        seguras

                                    </p>


                                </div>


                            </div>


                        </div>





                        <div className="col-lg-6 text-center text-lg-end">


                            <img

                                src={banner}

                                alt="Especialista en visión"

                                className="img-fluid hero-img rounded-4"

                            />


                        </div>



                    </div>


                </div>


            </section>





            {/* HERRAMIENTAS */}



            <section className="py-5 bg-light-section herramientas-section">


                <div className="container text-center mb-5">


                    <h2 className="section-title mb-5">

                        Herramientas diseñadas para el especialista

                    </h2>



                    <div className="row g-4 justify-content-center">



                        <FeatureCard

                            icon="bi-file-earmark-text"

                            title="Historial clínico digital"

                            text="Registra antecedentes médicos, alergias y evolución visual de forma rápida antes o durante la consulta."

                        />



                        <FeatureCard

                            icon="bi-eyeglasses"

                            title="Módulo de refracción"

                            text="Ingresa y calcula fórmulas ópticas de manera exacta (esfera, cilindro, eje, adición) listas para impresión o envío."

                        />



                        <FeatureCard

                            icon="bi-person-add"

                            title="Gestión de pacientes"

                            text="Base de datos centralizada con buscador inteligente por RUT/DNI, nombre o fecha de atención."

                        />



                        <FeatureCard

                            icon="bi-speedometer"

                            title="Dashboard de diagnósticos"

                            text="Visualiza reportes en tiempo real y estadísticas clínicas que ayudan a optimizar las decisiones de tu equipo médico."

                        />



                    </div>


                </div>


            </section>







            {/* SOBRE NOSOTROS */}



            <section
                id="sobre-nosotros"
                className="bg-brand-blue py-5 text-white"
            >


                <div className="container py-4">


                    <div className="row mb-5">


                        <div className="col-12 text-center">


                            <h2 className="fw-bold text-white underline-title">

                                Sobre Nosotros

                            </h2>


                        </div>


                    </div>





                    <div className="row g-4">


                        <InfoCard

                            title="Alianza salud + tecnología"

                            text="Fusionamos la experiencia en el desarrollo de software con el entendimiento profundo del sector óptico. Creamos herramientas pensadas por y para especialistas de la visión."

                        />



                        <InfoCard

                            title="Seguridad en cada registro"

                            text="Asumimos que la ficha clínica es un documento legal y privado. Por eso protegemos tus datos bajo altos estándares internacionales, cifrado y respaldos automáticos."

                        />



                        <InfoCard

                            title="Soporte humano y continuo"

                            text="No nos detenemos tras la implementación. Estamos contigo en cada paso desde la migración de tus datos hasta la capacitación del equipo."

                        />



                    </div>


                </div>


            </section>







            {/* FLUJO DE TRABAJO */}



            <section className="py-5 section-flujo">


                <div className="container text-center my-4">


                    <h2 className="fw-bold text-brand-primary fs-1 mb-2">

                        Flujo de trabajo en consulta

                    </h2>



                    <p className="text-muted fs-5">

                        Cómo opera el médico con el software

                    </p>





                    <div className="row g-4 justify-content-center mt-4">



                        <WorkflowStep

                            number="1"

                            title="Ingreso del paciente"

                            text="La recepción o el médico registra los datos personales básicos en segundos."

                        />



                        <WorkflowStep

                            number="2"

                            active

                            title="Evaluación y receta"

                            text="El profesional ingresa los valores de refracción y diagnóstico clínico."

                        />



                        <WorkflowStep

                            number="3"

                            title="Historial guardado"

                            text="La ficha queda archivada permitiendo comparativas futuras."

                        />



                    </div>



                </div>


            </section>



        </main>

    );

}




function FeatureCard({ icon, title, text }) {


    return (

        <div className="col-md-6 col-lg-5 text-start">


            <div className="card h-100 custom-card">


                <div className="card-body p-4">


                    <div className="fs-3 text-brand-primary mb-3">

                        <i className={`bi ${icon}`}></i>

                    </div>


                    <h5 className="card-title fw-bold mb-2">

                        {title}

                    </h5>


                    <p className="card-text text-muted">

                        {text}

                    </p>


                </div>


            </div>


        </div>

    );


}




function InfoCard({ title, text }) {


    return (

        <div className="col-md-4">


            <div className="card bg-transparent border-white text-white h-100 info-card">


                <div className="card-body p-4">


                    <h5 className="fw-bold mb-3 text-center">

                        {title}

                    </h5>


                    <p className="text-white">

                        {text}

                    </p>


                </div>


            </div>


        </div>

    );


}




function WorkflowStep({ number, title, text, active }) {


    return (

        <div className="col-md-4 text-center">


            <div className={`step-number mx-auto mb-4 ${active ? "active" : ""}`}>

                {number}

            </div>


            <h3 className="h5 fw-bold text-brand-primary mb-3">

                {title}

            </h3>


            <p className="text-muted px-3 small">

                {text}

            </p>


        </div>

    );


}



export default Home;
