import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Star, TrendingUp, RefreshCw, Crown } from 'lucide-react';
import { getSellerRanking } from '../api/reports.api';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (val) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val ?? 0);

const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

// ─── Avatar component ────────────────────────────────────────────────────────

function Avatar({ seller, sizeClass, gradientClass, ringClass, shadowClass, textClass }) {
    if (seller?.profilePhotoUrl) {
        return (
            <img
                src={seller.profilePhotoUrl}
                alt={seller.sellerName}
                className={`${sizeClass} rounded-full object-cover ring-2 ${ringClass} shadow-lg ${shadowClass}`}
            />
        );
    }
    return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center ring-2 ${ringClass} shadow-lg ${shadowClass} font-bold text-white`}>
            {getInitials(seller?.sellerName)}
        </div>
    );
}

// ─── Medal configs ───────────────────────────────────────────────────────────

const MEDALS = [
    {
        position: 1,
        label: '1°',
        ringColor: 'ring-yellow-400',
        avatarBg: 'from-yellow-400 to-amber-500',
        podiumBg: 'from-yellow-400/20 to-amber-500/10 dark:from-yellow-500/20 dark:to-amber-600/10',
        podiumBorder: 'border-yellow-400/50 dark:border-yellow-500/40',
        badgeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        badgeText: 'text-yellow-700 dark:text-yellow-300',
        height: 'h-36',
        icon: <Crown className="w-5 h-5 text-yellow-500" />,
        avatarSize: 'w-20 h-20 text-2xl',
        shadow: 'shadow-yellow-200/60 dark:shadow-yellow-900/40',
    },
    {
        position: 2,
        label: '2°',
        ringColor: 'ring-slate-300',
        avatarBg: 'from-slate-400 to-slate-500',
        podiumBg: 'from-slate-200/40 to-slate-300/20 dark:from-slate-600/20 dark:to-slate-700/10',
        podiumBorder: 'border-slate-300/60 dark:border-slate-600/40',
        badgeBg: 'bg-slate-100 dark:bg-slate-700/60',
        badgeText: 'text-slate-600 dark:text-slate-300',
        height: 'h-24',
        icon: <Medal className="w-5 h-5 text-slate-400" />,
        avatarSize: 'w-16 h-16 text-xl',
        shadow: 'shadow-slate-200/60 dark:shadow-slate-900/40',
    },
    {
        position: 3,
        label: '3°',
        ringColor: 'ring-amber-500',
        avatarBg: 'from-amber-600 to-orange-600',
        podiumBg: 'from-amber-100/40 to-orange-100/20 dark:from-amber-800/20 dark:to-orange-900/10',
        podiumBorder: 'border-amber-400/50 dark:border-amber-600/40',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
        badgeText: 'text-amber-700 dark:text-amber-300',
        height: 'h-20',
        icon: <Medal className="w-5 h-5 text-amber-600" />,
        avatarSize: 'w-14 h-14 text-lg',
        shadow: 'shadow-amber-200/60 dark:shadow-amber-900/40',
    },
];

// ─── Podium Card ─────────────────────────────────────────────────────────────

function PodiumCard({ seller, medal, isMe, onClickProfile }) {
    if (!seller) {
        return (
            <div className="flex flex-col items-center gap-2">
                <div className={`${medal.avatarSize} rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center ring-2 ring-gray-300 dark:ring-slate-600`}>
                    <span className="text-gray-400 dark:text-slate-500 text-lg font-bold">?</span>
                </div>
                <div className={`w-full ${medal.height} rounded-t-xl border ${medal.podiumBorder} bg-gradient-to-b ${medal.podiumBg} flex items-center justify-center`}>
                    <span className="text-xs text-gray-400 dark:text-slate-500">Sin datos</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col items-center gap-2 cursor-pointer group"
            onClick={() => onClickProfile(seller.sellerId)}
        >
            {/* Position badge + icon */}
            <div className="flex items-center gap-1 mb-1">
                {medal.icon}
                <span className={`text-xs font-bold ${medal.badgeText}`}>{medal.label}</span>
            </div>

            {/* Avatar */}
            <div className="relative group-hover:scale-105 transition-transform">
                <Avatar
                    seller={seller}
                    sizeClass={medal.avatarSize}
                    gradientClass={medal.avatarBg}
                    ringClass={medal.ringColor}
                    shadowClass={medal.shadow}
                />
                {isMe && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
                        Tú
                    </span>
                )}
            </div>

            {/* Name */}
            <p className={`text-sm font-semibold text-center text-gray-800 dark:text-white max-w-[110px] leading-tight group-hover:text-primary transition-colors ${medal.position === 1 ? 'text-base' : ''}`}>
                {seller.sellerName}
            </p>

            {/* Stats */}
            <div className={`text-center px-3 py-1.5 rounded-lg ${medal.badgeBg} mb-1`}>
                <p className={`text-sm font-bold ${medal.badgeText}`}>{formatCurrency(seller.totalSales)}</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">{seller.salesCount} venta{seller.salesCount !== 1 ? 's' : ''}</p>
            </div>

            {/* Podium block */}
            <div className={`w-full ${medal.height} rounded-t-xl border ${medal.podiumBorder} bg-gradient-to-b ${medal.podiumBg} flex items-start justify-center pt-3`}>
                <span className={`text-2xl font-black ${medal.badgeText} opacity-30`}>{medal.label}</span>
            </div>
        </div>
    );
}

// ─── Seller Row (for list below podium) ─────────────────────────────────────

function SellerRow({ seller, position, isMe, onClickProfile }) {
    return (
        <li
            onClick={() => onClickProfile(seller.sellerId)}
            className={`flex items-center gap-4 px-5 py-3 cursor-pointer ${isMe ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'} transition-colors`}
        >
            <span className={`w-7 text-center text-sm font-bold flex-shrink-0 ${isMe ? 'text-primary' : 'text-gray-400 dark:text-slate-500'}`}>
                {position}°
            </span>
            <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden">
                {seller.profilePhotoUrl ? (
                    <img src={seller.profilePhotoUrl} alt={seller.sellerName} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(seller.sellerName)}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isMe ? 'text-primary' : 'text-gray-800 dark:text-white'}`}>
                    {seller.sellerName}
                    {isMe && <span className="ml-1.5 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-semibold">Tú</span>}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{seller.salesCount} venta{seller.salesCount !== 1 ? 's' : ''} aprobadas</p>
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex-shrink-0">
                {formatCurrency(seller.totalSales)}
            </p>
        </li>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

function RankingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userId = user?.userId || user?.id;
    const isAdmin = user?.roles?.includes('ADMIN');
    const userRole = user?.roles?.[0];

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getSellerRanking(10);
            setRanking(res.data);
        } catch (e) {
            setError('No se pudo cargar el ranking.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const top3 = [ranking[1], ranking[0], ranking[2]]; // 2nd – 1st – 3rd (podium order)
    const rest = ranking.slice(3);

    const myPosition = ranking.findIndex(s => s.sellerId === userId);

    const goToProfile = (sellerId) => {
        const prefix = isAdmin ? '/admin' : '/seller';
        navigate(`${prefix}/profile/${sellerId}`);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center py-20">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                    <p className="text-sm text-gray-500 dark:text-slate-400">Cargando ranking...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center py-20">
                <div className="text-center">
                    <p className="text-sm text-red-500 mb-3">{error}</p>
                    <button onClick={load} className="text-xs text-primary hover:underline">Reintentar</button>
                </div>
            </div>
        );
    }

    if (ranking.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center py-20">
                <div className="text-center">
                    <Trophy className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Aún no hay ventas aprobadas</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Sé el primero en aparecer en el ranking.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/30 mb-3">
                        <Trophy className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ranking de Vendedores</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Top vendedores por total de ventas aprobadas</p>
                    {myPosition >= 0 && (
                        <div className="inline-flex items-center gap-1.5 mt-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                            <Star className="w-3.5 h-3.5" />
                            Tu posición: #{myPosition + 1}
                        </div>
                    )}
                </div>

                {/* Podium */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-border-dark p-6 shadow-sm">
                    <div className="grid grid-cols-3 gap-3 items-end">
                        {top3.map((seller, i) => {
                            const medalIndex = [1, 0, 2][i];
                            const medal = MEDALS[medalIndex];
                            const isMe = seller?.sellerId === userId;
                            return (
                                <PodiumCard
                                    key={medal.position}
                                    seller={seller}
                                    medal={medal}
                                    isMe={isMe}
                                    onClickProfile={goToProfile}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Rest of ranking — admin sees all, sellers only see their own position */}
                {isAdmin ? (
                    rest.length > 0 && (
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm">
                            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-border-dark flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Otros vendedores
                                </h3>
                                <button
                                    onClick={load}
                                    className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 flex items-center gap-1 transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Actualizar
                                </button>
                            </div>
                            <ul className="divide-y divide-gray-100 dark:divide-border-dark/50">
                                {rest.map((seller, idx) => (
                                    <SellerRow
                                        key={seller.sellerId}
                                        seller={seller}
                                        position={idx + 4}
                                        isMe={seller.sellerId === userId}
                                        onClickProfile={goToProfile}
                                    />
                                ))}
                            </ul>
                        </div>
                    )
                ) : (
                    myPosition >= 3 && (
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm">
                            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-border-dark">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-primary" />
                                    Tu posición
                                </h3>
                            </div>
                            <SellerRow
                                seller={ranking[myPosition]}
                                position={myPosition + 1}
                                isMe={true}
                                onClickProfile={goToProfile}
                            />
                        </div>
                    )
                )}

                {/* Footer */}
                <div className="text-center pb-2">
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                        Ranking basado en el total de ventas aprobadas por el administrador.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RankingPage;
