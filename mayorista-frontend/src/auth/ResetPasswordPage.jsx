import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../api/auth.api';

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    // Check if token exists
    useEffect(() => {
        if (!token) {
            setError('Token de recuperación no válido o expirado.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword(token, formData.password);
            setIsSuccess(true);
        } catch (err) {
            console.error(err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Error al restablecer la contraseña. El token puede haber expirado.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen h-screen bg-mayorista-surface flex items-center justify-center relative">
            <div className="w-full flex items-center justify-center py-8 px-4 pb-24 relative z-10 overflow-auto">
                <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 md:p-10 relative my-auto">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <img
                            src="https://megamayorista.net/wp-content/uploads/2025/09/cropped-cropped-LOGO-LARGO.webp"
                            alt="El Mayorista Logo"
                            className="h-14 object-contain"
                        />
                    </div>

                    {!isSuccess ? (
                        <>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-mayorista-text-primary mb-2">
                                    Restablecer contraseña
                                </h2>
                                <p className="text-mayorista-text-secondary text-sm">
                                    Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm flex items-start gap-2">
                                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Form */}
                            {token && (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-mayorista-text-primary text-sm font-semibold mb-2">
                                            Nueva contraseña
                                        </label>
                                        <div className="relative flex border border-gray-200 rounded-md focus-within:border-mayorista-red focus-within:ring-1 focus-within:ring-mayorista-red">
                                            <div className="w-12 flex items-center justify-center bg-white border-r border-gray-200 rounded-l-md">
                                                <Lock className="text-mayorista-text-secondary w-5 h-5" />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="flex-1 px-4 pr-12 py-3 focus:outline-none bg-white text-mayorista-text-primary placeholder:text-mayorista-text-secondary"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-mayorista-text-secondary hover:text-mayorista-red transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-mayorista-text-primary text-sm font-semibold mb-2">
                                            Confirmar contraseña
                                        </label>
                                        <div className="relative flex border border-gray-200 rounded-md focus-within:border-mayorista-red focus-within:ring-1 focus-within:ring-mayorista-red">
                                            <div className="w-12 flex items-center justify-center bg-white border-r border-gray-200 rounded-l-md">
                                                <Lock className="text-mayorista-text-secondary w-5 h-5" />
                                            </div>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="flex-1 px-4 pr-12 py-3 focus:outline-none bg-white text-mayorista-text-primary placeholder:text-mayorista-text-secondary"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-mayorista-text-secondary hover:text-mayorista-red transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-mayorista-red hover:bg-opacity-90 text-white font-semibold py-3.5 rounded-md transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
                                    </button>
                                </form>
                            )}

                            {/* Back to login link */}
                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="text-sm text-mayorista-red hover:underline transition-colors"
                                >
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        </>
                    ) : (
                        /* Success State */
                        <div className="text-center">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-mayorista-text-primary mb-3">
                                ¡Contraseña actualizada!
                            </h2>

                            <p className="text-mayorista-text-secondary mb-6">
                                Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
                            </p>

                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-mayorista-red hover:bg-opacity-90 text-white font-semibold py-3.5 rounded-md transition-all shadow-sm hover:shadow-md"
                            >
                                Iniciar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Copyright - Fixed Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-mayorista-white/90 backdrop-blur-sm border-t border-gray-200 py-3 text-center z-50">
                <p className="text-xs text-mayorista-text-secondary">© 2026 El Mayorista</p>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
