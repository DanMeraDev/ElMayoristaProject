import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function SellerFooter() {
    const navigate = useNavigate();

    return (
        <footer className="mt-auto px-8 py-6 border-t border-gray-200 dark:border-border-dark flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 dark:text-slate-400 bg-white dark:bg-surface-dark transition-colors">
            <p>© 2026 El Mayorista. Panel de Vendedor.</p>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
                <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Sesión Segura
                </span>
                <button onClick={() => navigate('/seller/soporte')} className="hover:text-primary transition-colors">Soporte</button>
            </div>
        </footer>
    );
}

export default SellerFooter;
