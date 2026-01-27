import StaticLayout from '@/layouts/static-layout';

export default function Bolepay() {
    return (
        <StaticLayout title="Bolepay">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Modalidad de Pago Bolepay</h1>
                    <p className="text-xl text-gray-600 font-medium">
                        A continuación se describen las condiciones aplicables para realizar compras mediante la modalidad “Crédito sin Tarjeta” de BOLEPAY.
                    </p>
                </div>

                <div className="space-y-8 text-gray-700 leading-relaxed">
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Condiciones Generales</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Pago de un enganche y cargo por servicio, sobre el total del precio al momento de adquirir el boleto.</li>
                            <li>El cliente podrá realizar abonos parciales por cualquier monto y en cualquier fecha, considerando que el total a diferir deberá estar cubierto <span className="font-semibold">8 días naturales antes del evento</span>.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Declaración de Conformidad</h3>
                        <p className="mb-4">
                            Manifiesto conformidad y aceptación con las condiciones establecidas en la compra del boleto en su modalidad “Crédito sin Tarjeta”, mismas que se detallan a continuación:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Un pago inicial del 25% más cargos por venta.</li>
                            <li>El cliente recibirá una orden de compra para realizar sus abonos parciales. El boleto de acceso será entregado únicamente cuando el TOTAL A DIFERIR esté completamente pagado.</li>
                            <li>En caso de llegar a la FECHA DE VENCIMIENTO (8 días naturales antes del evento) sin haber completado el pago total, Sistemas Innovadores para Espectáculos SA de CV (BOLEPAY) podrá cancelar de manera definitiva el(los) boleto(s), sin derecho a reactivación y sin devolución del enganche, cargo por servicio o cargos administrativos.</li>
                            <li>Si al llegar a la fecha límite no se ha completado el TOTAL A DIFERIR, el cliente recibirá en su Monedero electrónico BOLETEA la suma de todos sus abonos parciales (no incluye enganche ni cargos adicionales). Dicho monedero podrá utilizarse en cualquier otro evento disponible en la plataforma de Boletea.</li>
                        </ul>
                    </section>

                    <section className="bg-gray-50 p-6 rounded-lg text-sm text-gray-600">
                        <p>
                            Cualquier condición no prevista en este documento se regirá conforme a los Términos y Condiciones de Boletea Tickets, los cuales pueden consultarse en: <br />
                            <a href="https://www.boletea.com/terminosycondiciones" className="text-blue-600 hover:underline break-all" target="_blank" rel="noopener noreferrer">
                                https://www.boletea.com/terminosycondiciones
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </StaticLayout>
    );
}
