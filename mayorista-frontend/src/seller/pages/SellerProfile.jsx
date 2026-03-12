import { useState, useRef, useEffect } from 'react';
import { Camera, Save, User as UserIcon, MapPin, Phone, Mail, FileText, RefreshCw, Check, AtSign, ImageIcon } from 'lucide-react';
import SellerSidebar from '../components/SellerSidebar';
import SellerTopbar from '../components/SellerTopbar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateMyProfile, uploadProfilePhoto, uploadCoverPhoto } from '../../api/profile.api';

function SellerProfile() {
    const { user, refreshUser, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const [form, setForm] = useState({
        fullName: '',
        nickname: '',
        bio: '',
        city: '',
        phoneNumber: '',
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            setForm({
                fullName: user.fullName || '',
                nickname: user.nickname || '',
                bio: user.bio || '',
                city: user.city || '',
                phoneNumber: user.phoneNumber || '',
            });
            setPhotoPreview(user.profilePhotoUrl || null);
            setCoverPreview(user.coverPhotoUrl || null);
        }
    }, [user]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleImageUpload = async (file, type) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Solo se permiten archivos de imagen');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen no puede superar 5MB');
            return;
        }

        const setUploading = type === 'profile' ? setUploadingPhoto : setUploadingCover;
        const uploadFn = type === 'profile' ? uploadProfilePhoto : uploadCoverPhoto;
        const setPreview = type === 'profile' ? setPhotoPreview : setCoverPreview;

        setUploading(true);
        setError(null);
        try {
            const res = await uploadFn(file);
            setPreview(res.data.url);
            await refreshUser();
        } catch (err) {
            setError(type === 'profile' ? 'Error al subir la foto de perfil' : 'Error al subir la foto de portada');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await updateMyProfile(form);
            await refreshUser();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const initials = (user?.fullName || 'V').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-background-dark overflow-hidden">
            <SellerSidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                user={user}
                onLogout={() => { logout(); navigate('/login'); }}
            />

            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
                <SellerTopbar
                    isSidebarOpen={sidebarOpen}
                    onSidebarOpen={() => setSidebarOpen(true)}
                    title="Mi Perfil"
                />

                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                        {/* Photo + Header */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm">
                            {/* Cover Banner */}
                            <div className="h-32 relative group">
                                {coverPreview ? (
                                    <img
                                        src={coverPreview}
                                        alt="Portada"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-primary to-orange-400" />
                                )}
                                {/* Cover edit overlay */}
                                <button
                                    onClick={() => coverInputRef.current?.click()}
                                    disabled={uploadingCover}
                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-lg">
                                        {uploadingCover ? (
                                            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Subiendo...</>
                                        ) : (
                                            <><ImageIcon className="w-3.5 h-3.5" /> Cambiar portada</>
                                        )}
                                    </span>
                                </button>
                                <input
                                    ref={coverInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => handleImageUpload(e.target.files?.[0], 'cover')}
                                />
                            </div>

                            <div className="px-6 pb-6">
                                {/* Avatar */}
                                <div className="relative -mt-14 mb-4 flex justify-center">
                                    <div className="relative group">
                                        {photoPreview ? (
                                            <img
                                                src={photoPreview}
                                                alt="Foto de perfil"
                                                className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-surface-dark shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center border-4 border-white dark:border-surface-dark shadow-lg">
                                                <span className="text-3xl font-bold text-white">{initials}</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingPhoto}
                                            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-hover transition-colors border-2 border-white dark:border-surface-dark"
                                        >
                                            {uploadingPhoto ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Camera className="w-4 h-4" />
                                            )}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => handleImageUpload(e.target.files?.[0], 'profile')}
                                        />
                                    </div>
                                </div>

                                <div className="text-center">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {user?.fullName}
                                    </h2>
                                    {user?.nickname && (
                                        <p className="text-sm text-primary font-medium">@{user.nickname}</p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Edit Form */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-border-dark p-6 shadow-sm space-y-5">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-primary" />
                                Informacion Personal
                            </h3>

                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                                    Nombre completo
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={form.fullName}
                                        onChange={e => handleChange('fullName', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-border-dark rounded-lg bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors"
                                        placeholder="Tu nombre completo"
                                    />
                                </div>
                            </div>

                            {/* Nickname */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                                    Nombre de usuario (opcional)
                                </label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={form.nickname}
                                        onChange={e => handleChange('nickname', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-border-dark rounded-lg bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors"
                                        placeholder="ej: juanventas"
                                    />
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                                    Descripcion / Bio
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <textarea
                                        value={form.bio}
                                        onChange={e => handleChange('bio', e.target.value)}
                                        rows={3}
                                        maxLength={300}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-border-dark rounded-lg bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors resize-none"
                                        placeholder="Cuentanos sobre ti..."
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-slate-500 text-right mt-1">{form.bio.length}/300</p>
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                                    Ciudad
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={e => handleChange('city', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-border-dark rounded-lg bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors"
                                        placeholder="ej: Quito"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                                    Telefono
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={form.phoneNumber}
                                        onChange={e => handleChange('phoneNumber', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-border-dark rounded-lg bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors"
                                        placeholder="0912345678"
                                    />
                                </div>
                            </div>

                            {/* Email (read only) */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={user?.email || ''}
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-border-dark rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">El email no se puede cambiar</p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* Save */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-sm disabled:opacity-50"
                            >
                                {saving ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
                                ) : saved ? (
                                    <><Check className="w-4 h-4" /> Guardado</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Guardar cambios</>
                                )}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default SellerProfile;
