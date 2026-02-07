import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { MessageSquare, Bug, Lightbulb, Send, Filter, CheckCircle, Clock, XCircle, Moon, Sun, Bell, ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react';
import SellerSidebar from '../components/SellerSidebar';
import SellerFooter from '../components/SellerFooter';
import { createTicket, getMyTickets } from '../../api/support.api';

const SellerSupport = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [formData, setFormData] = useState({
        type: 'BUG',
        subject: '',
        description: ''
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const data = await getMyTickets();
            setTickets(data);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject.trim() || !formData.description.trim()) {
            return;
        }

        setSubmitting(true);
        try {
            await createTicket(formData);
            setFormData({ type: 'BUG', subject: '', description: '' });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            loadTickets();
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Error al enviar el ticket. Por favor intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'OPEN':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'IN_PROGRESS':
                return <Clock className="w-4 h-4 text-blue-500" />;
            case 'RESOLVED':
            case 'CLOSED':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            default:
                return <XCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            'OPEN': 'Abierto',
            'IN_PROGRESS': 'En Progreso',
            'RESOLVED': 'Resuelto',
            'CLOSED': 'Cerrado'
        };
        return statusMap[status] || status;
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'BUG':
                return <Bug className="w-5 h-5 text-red-500" />;
            case 'RECOMMENDATION':
                return <Lightbulb className="w-5 h-5 text-yellow-500" />;
            default:
                return <MessageSquare className="w-5 h-5 text-blue-500" />;
        }
    };

    const getTypeText = (type) => {
        const typeMap = {
            'BUG': 'Bug',
            'RECOMMENDATION': 'Recomendación',
            'OTHER': 'Otro'
        };
        return typeMap[type] || type;
    };

    const filteredTickets = tickets.filter(ticket => {
        if (filter === 'ALL') return true;
        return ticket.type === filter;
    });

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-slate-100 min-h-screen transition-colors duration-200">
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <SellerSidebar
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    user={user}
                    onLogout={() => setShowLogoutModal(true)}
                />

                {/* Main Content Area */}
                <main className={`flex-1 h-full overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
                    {/* Top Header */}
                    <header className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-border-dark h-16 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm transition-colors duration-200">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className={`flex mr-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400 ${isSidebarOpen ? 'md:hidden' : ''}`}
                                title={isSidebarOpen ? "Cerrar menú" : "Mostrar menú"}
                            >
                                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Soporte Técnico</h1>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6">
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 text-gray-400 hover:text-primary dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                            >
                                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="p-8 max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MessageSquare className="w-8 h-8" />
                                Soporte Técnico
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Reporta bugs o envía recomendaciones para mejorar la plataforma
                            </p>
                        </div>

                        {showSuccess && (
                            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                                <p className="text-green-800 dark:text-green-200 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Ticket enviado exitosamente
                                </p>
                            </div>
                        )}

                        {/* Ticket Form */}
                        <div className="bg-white dark:bg-surface-dark rounded-lg shadow-lg p-6 mb-8 border border-gray-100 dark:border-border-dark">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Send className="w-5 h-5" />
                                Nuevo Ticket
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Tipo
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="BUG"
                                                checked={formData.type === 'BUG'}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <Bug className="w-4 h-4 text-red-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Bug</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="RECOMMENDATION"
                                                checked={formData.type === 'RECOMMENDATION'}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Recomendación</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="type"
                                                value="OTHER"
                                                checked={formData.type === 'OTHER'}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <MessageSquare className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Otro</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Asunto
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Describe brevemente el problema o sugerencia"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                        maxLength="200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Proporciona todos los detalles posibles..."
                                        rows="5"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 
                                             rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                             flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    {submitting ? 'Enviando...' : 'Enviar Ticket'}
                                </button>
                            </form>
                        </div>

                        {/* Tickets List */}
                        <div className="bg-white dark:bg-surface-dark rounded-lg shadow-lg p-6 border border-gray-100 dark:border-border-dark">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Mis Tickets
                                </h2>

                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-500" />
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="ALL">Todos</option>
                                        <option value="BUG">Bugs</option>
                                        <option value="RECOMMENDATION">Recomendaciones</option>
                                        <option value="OTHER">Otros</option>
                                    </select>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    Cargando tickets...
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No hay tickets para mostrar
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredTickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 
                                                     hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    {getTypeIcon(ticket.type)}
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {ticket.subject}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {getTypeText(ticket.type)} • {new Date(ticket.createdAt).toLocaleDateString('es-EC')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full
                                                              bg-gray-100 dark:bg-gray-700">
                                                    {getStatusIcon(ticket.status)}
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {getStatusText(ticket.status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                                                {ticket.description}
                                            </p>
                                            {ticket.adminNotes && (
                                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                                                        Respuesta del administrador:
                                                    </p>
                                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                                        {ticket.adminNotes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <SellerFooter />
                </main>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-sm w-full p-6 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Cerrar Sesión
                            </h3>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            ¿Estás seguro que deseas cerrar sesión?
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                className="px-4 py-2 bg-mayorista-red hover:bg-opacity-90 text-white font-medium rounded-md transition-colors"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerSupport;
