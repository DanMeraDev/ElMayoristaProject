import { useState } from 'react';
import { Trophy } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import { useAuth } from '../../context/AuthContext';
import RankingPage from '../../pages/RankingPage';

function AdminRanking() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-background-dark overflow-hidden">
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <AdminTopbar
                    isSidebarOpen={sidebarOpen}
                    onSidebarOpen={() => setSidebarOpen(true)}
                    title="Ranking de Vendedores"
                    icon={<Trophy className="w-5 h-5 text-yellow-500" />}
                />

                <RankingPage />
            </div>
        </div>
    );
}

export default AdminRanking;
