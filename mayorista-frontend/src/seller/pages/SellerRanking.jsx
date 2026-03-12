import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import SellerSidebar from '../components/SellerSidebar';
import SellerTopbar from '../components/SellerTopbar';
import { useAuth } from '../../context/AuthContext';
import RankingPage from '../../pages/RankingPage';

function SellerRanking() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-background-dark overflow-hidden">
            <SellerSidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                user={user}
                onLogout={handleLogout}
            />

            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
                {/* Top bar */}
                <SellerTopbar
                    isSidebarOpen={sidebarOpen}
                    onSidebarOpen={() => setSidebarOpen(true)}
                    title="Ranking de Vendedores"
                />

                <RankingPage />
            </div>
        </div>
    );
}

export default SellerRanking;
