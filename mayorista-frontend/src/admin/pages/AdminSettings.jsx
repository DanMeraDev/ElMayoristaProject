import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Shield,
    Users,
    DollarSign,
    CreditCard
} from 'lucide-react';
import AdminFooter from '../components/AdminFooter';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import RoleManagement from '../components/RoleManagement';
import FiadoManagement from '../components/FiadoManagement';
import CustomerManagement from '../components/CustomerManagement';

function AdminSettings() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const validTabs = ['roles', 'fiados', 'clientes'];
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(validTabs.includes(tabParam) ? tabParam : 'roles');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (validTabs.includes(tab)) setActiveTab(tab);
    }, [searchParams]);

    const tabs = [
        { id: 'roles', label: 'Gestión de Roles', icon: Shield },
        { id: 'fiados', label: 'Gestión de Fiados', icon: CreditCard },
        { id: 'clientes', label: 'Gestión de Clientes', icon: Users },
    ];

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex transition-colors duration-200">
            {/* Sidebar */}
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                pendingRequestsCount={0}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <AdminTopbar
                    isSidebarOpen={isSidebarOpen}
                    onSidebarOpen={() => setIsSidebarOpen(true)}
                    title="Configuración"
                />

                {/* Content */}
                <div className="p-4 sm:p-8 flex-1 overflow-y-auto flex flex-col">
                    <div className="space-y-6 flex-1">
                        {/* Title */}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración del Sistema</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Gestiona los ajustes y permisos de la plataforma.</p>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-border-light dark:border-border-dark">
                            <nav className="flex gap-2 overflow-x-auto">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                                    ? 'border-primary text-primary'
                                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1">
                            {activeTab === 'roles' && <RoleManagement />}
                            {activeTab === 'fiados' && <FiadoManagement />}
                            {activeTab === 'clientes' && <CustomerManagement />}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <AdminFooter />
            </main>
        </div>
    );
}

export default AdminSettings;
