import StaticLayout from '@/layouts/static-layout';

export default function SalesCenters() {
    return (
        <StaticLayout title="Centros de Venta">
            <p className="text-xl font-medium mb-8">
                Encuentra tu centro de venta más cercano en Coahuila, Durango, Mérida y Quintana Roo.
            </p>

            <div className="grid gap-6 md:grid-cols-2 not-prose">
                <div className="p-6 border rounded-2xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-[#c90000] transition-colors group">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#c90000]">Coliseo Centenario</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">San Pedro de las Colonias S/N, Arboleda 27018 Torreón, Coah.</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Horarios</p>
                    <p className="text-sm">Lunes - Sábado : 10:00 am a 6:00 pm</p>
                </div>

                <div className="p-6 border rounded-2xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-[#c90000] transition-colors group">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#c90000]">Suc. Hidalgo</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Av. Hidalgo 399. Primero de Cobian centro 2700 Torreón, Coah.</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Horarios</p>
                    <p className="text-sm">Lunes - Domingo : 11:00 am a 7:00 pm</p>
                </div>

                <div className="p-6 border rounded-2xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-[#c90000] transition-colors group">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#c90000]">Suc. 4 Caminos</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Plaza Cuatro Caminos, Blvrd Independencia 1300 Torreón, Coah.</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Horarios</p>
                    <p className="text-sm">Lunes - Domingo : 11:00 am a 7:00 pm</p>
                </div>

                <div className="p-6 border rounded-2xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-[#c90000] transition-colors group">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#c90000]">Suc. Fco. I. Madero</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Nicolás Bravo #20-local 2. Madero. 27900 Fco. I. Madero, Coah.</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Horarios</p>
                    <p className="text-sm">Lunes - Sábados : 10:00 am a 7:00 pm <br /> Domingo: 10:00 am a 2:00 pm</p>
                </div>

                <div className="p-6 border rounded-2xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-[#c90000] transition-colors group">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#c90000]">Suc. San Pedro</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Zaragoza No. 42-Local 2, Centro, 27800 San Pedro, Coah.</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Horarios</p>
                    <p className="text-sm">Lunes - Sábados : 11:00 am a 7:00 pm</p>
                </div>

                <div className="p-6 border rounded-2xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-[#c90000] transition-colors group">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#c90000]">Sombrereria la fe</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cepeda 111, Zona Centro, Francisco I. Madero, Coah. CP: 27900</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Horarios</p>
                    <p className="text-sm">Lunes - Domingo : 11:00 am a 9:00 pm</p>
                </div>
            </div>
        </StaticLayout>
    );
}
