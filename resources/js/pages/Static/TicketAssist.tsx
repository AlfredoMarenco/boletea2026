import StaticLayout from '@/layouts/static-layout';

export default function TicketAssist() {
    return (
        <StaticLayout title="Ticket Assist">
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <div className="mb-10 text-center">
                    <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                        Ticket Assist
                    </h1>
                    <p className="text-xl font-medium text-gray-600">
                        Estás protegido en caso de alguna eventualidad que te
                        impida asistir a tu evento.
                    </p>
                </div>

                <div className="space-y-8 leading-relaxed text-gray-700">
                    <section>
                        <h3 className="mb-4 text-xl font-bold text-gray-900">
                            Tus boletos serán reembolsables en casos como:
                        </h3>
                        <ul className="mb-4 list-disc space-y-2 pl-6">
                            <li>
                                Accidente del comprador o de un familiar en
                                primer grado que impida la asistencia al evento.
                            </li>
                            <li>
                                Enfermedad del comprador o de un familiar en
                                primer grado que, bajo recomendación médica,
                                impida la asistencia al evento.
                            </li>
                            <li>
                                Defunción del comprador o de un familiar en
                                primer grado.
                            </li>
                            <li>
                                Afectaciones severas a la vivienda del comprador
                                por causa de incendio, inundación, derrumbe o
                                robo.
                            </li>
                            <li>
                                Retraso o cancelación de transporte foráneo, en
                                caso de no residir en la ciudad del evento.
                            </li>
                        </ul>
                        <div className="rounded-r border-l-4 border-blue-500 bg-gray-50 p-4 shadow-sm">
                            <ul className="space-y-1 text-sm md:text-base">
                                <li>
                                    • El monto máximo reembolsable será de
                                    $10,000 por concepto de precio de boleto y
                                    cargo por servicio.
                                </li>
                                <li>
                                    • El monto pagado por concepto de
                                    AseguraTicket no es reembolsable.
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h3 className="mb-4 text-xl font-bold text-gray-900">
                            Es necesario presentar, según sea el caso:
                        </h3>
                        <ul className="list-disc space-y-2 pl-6">
                            <li>
                                Constancia médica de alguna institución de salud
                                pública o privada que indique un plazo no mayor
                                a 48 hrs del incidente previo al evento.
                            </li>
                            <li>
                                Constancia médica de alguna institución de salud
                                pública o privada que indique un plazo no mayor
                                a 24 hrs de sintomatología previo al evento.
                            </li>
                            <li>
                                Acta de defunción que indique un plazo no mayor
                                a 48 hrs de la defunción previo al evento.
                            </li>
                            <li>
                                Peritaje de autoridad competente que indique un
                                plazo no mayor a 24 hrs del siniestro previo al
                                evento.
                            </li>
                            <li>
                                Registro de evidencia donde el prestador de
                                servicio de transporte incumple con fechas u
                                horarios del servicio contratado.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="mb-4 text-xl font-bold text-gray-900">
                            El reembolso no será aplicable en los siguientes
                            casos:
                        </h3>
                        <ul className="list-disc space-y-2 pl-6 text-red-700/80">
                            <li>Lesiones auto infringidas.</li>
                            <li>
                                Sintomatología relacionada directamente con el
                                abuso de sustancias tóxicas.
                            </li>
                            <li>Suicidio.</li>
                            <li>
                                Afectaciones a la vivienda atribuibles al
                                comprador.
                            </li>
                            <li>
                                Imposibilidad de viajar por razones atribuibles
                                al comprador.
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </StaticLayout>
    );
}
