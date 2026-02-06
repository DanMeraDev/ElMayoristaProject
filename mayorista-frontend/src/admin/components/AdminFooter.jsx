import { ShieldCheck } from 'lucide-react';

function AdminFooter() {
    return (
        <footer className="mt-auto border-t border-gray-200 dark:border-border-dark py-6 text-center text-xs text-gray-500 dark:text-slate-400 bg-white dark:bg-surface-dark transition-colors">
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Panel de Administración Seguro - Acceso Restringido</span>
                </div>
                <p>© 2026 El Mayorista. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}

export default AdminFooter;
