import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, MapPin, Mail, Phone, Calendar, ArrowLeft, RefreshCw, ShoppingBag, Star } from 'lucide-react';
import { getPublicProfile } from '../api/profile.api';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (val) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val ?? 0);

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-EC', { year: 'numeric', month: 'long' });
};

function ProfileView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await getPublicProfile(id);
                setProfile(res.data);
            } catch (e) {
                setError('No se pudo cargar el perfil');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleBack = () => navigate(-1);

    const initials = (profile?.fullName || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-background-dark flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                    <p className="text-sm text-gray-500 dark:text-slate-400">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-background-dark flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-red-500 mb-3">{error || 'Perfil no encontrado'}</p>
                    <button onClick={handleBack} className="text-xs text-primary hover:underline">Volver</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background-dark">
            <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

                {/* Back button */}
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </button>

                {/* Profile Card */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm">
                    {/* Banner */}
                    {profile.coverPhotoUrl ? (
                        <img src={profile.coverPhotoUrl} alt="" className="h-32 w-full object-cover" />
                    ) : (
                        <div className="h-32 bg-gradient-to-r from-primary to-orange-400" />
                    )}

                    <div className="px-6 pb-6">
                        {/* Avatar */}
                        <div className="relative -mt-16 mb-4 flex justify-center">
                            {profile.profilePhotoUrl ? (
                                <img
                                    src={profile.profilePhotoUrl}
                                    alt={profile.fullName}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-surface-dark shadow-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center border-4 border-white dark:border-surface-dark shadow-lg">
                                    <span className="text-4xl font-bold text-white">{initials}</span>
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <div className="text-center mb-4">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {profile.fullName}
                            </h1>
                            {profile.nickname && (
                                <p className="text-sm text-primary font-medium mt-0.5">@{profile.nickname}</p>
                            )}
                            {profile.city && (
                                <p className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-slate-400 mt-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {profile.city}
                                </p>
                            )}
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="text-sm text-gray-600 dark:text-slate-300 text-center max-w-md mx-auto leading-relaxed mb-5">
                                {profile.bio}
                            </p>
                        )}

                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-50 dark:bg-background-dark rounded-xl p-3 text-center">
                                <div className="flex items-center justify-center mb-1.5">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                </div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {profile.rankingPosition > 0 ? `#${profile.rankingPosition}` : '-'}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-slate-400">Ranking</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-background-dark rounded-xl p-3 text-center">
                                <div className="flex items-center justify-center mb-1.5">
                                    <ShoppingBag className="w-5 h-5 text-primary" />
                                </div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {profile.approvedSalesCount}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-slate-400">Ventas</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-background-dark rounded-xl p-3 text-center">
                                <div className="flex items-center justify-center mb-1.5">
                                    <Star className="w-5 h-5 text-green-500" />
                                </div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(profile.totalApprovedSales)}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-slate-400">Total vendido</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-border-dark p-5 shadow-sm space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Informacion</h3>

                    {profile.email && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-gray-700 dark:text-slate-300">{profile.email}</span>
                        </div>
                    )}

                    {profile.phoneNumber && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-4 h-4 text-green-500" />
                            </div>
                            <span className="text-gray-700 dark:text-slate-300">{profile.phoneNumber}</span>
                        </div>
                    )}

                    {profile.createdAt && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="text-gray-700 dark:text-slate-300">
                                Miembro desde {formatDate(profile.createdAt)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfileView;
