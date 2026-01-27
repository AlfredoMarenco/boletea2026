import StaticLayout from '@/layouts/static-layout';

export default function About() {
    return (
        <StaticLayout title="Quiénes Somos">
            <h2 className="text-3xl font-blod mb-4">Acerca de Nosotros</h2>
            <p>
                Boletea Tickets es una empresa comprometida con la calidad y calidez de su servicio, entregados al 100% para lograr sus objetivos. Actuando con transparencia y con fuertes valores que engrandecen su desempeño, con un sistema de boletaje innovador.
            </p>
            <p>
                Garantizando a sus usuarios el mejor contenido, respaldados en su gran experiencia y conocimiento en la industria. Pionera en México en ventas por Facebook, ofreciendo facilidad y nuevos métodos de venta de boletos.
            </p>

            <h2 className="text-3xl font-blod mt-4 mb-4">Misión</h2>
            <p>
                Para brindar el mejor servicio de boletaje, a través de atención personalizada y las mejores soluciones tecnológicas a nuestros socios y consumidores, con el fin de obtener su lealtad y preferencia.
            </p>

            <h2 className="text-3xl font-blod mt-4 mb-4">Visión</h2>
            <p>
                Ser una empresa líder y de mayor crecimiento en México, distinguiéndonos por la calidad de nuestros productos, servicios y de su fácil operación.
            </p>

            <h2 className="text-3xl font-blod mt-4 mb-4">Valores</h2>
            <ul className="mt-4 mb-4">
                <li>Ética</li>
                <li>Compromiso</li>
                <li>Liderazgo</li>
                <li>Dinamismo</li>
                <li>Innovación</li>
                <li>Pasión</li>
            </ul>
        </StaticLayout>
    );
}
