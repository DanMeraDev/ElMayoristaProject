import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth.api';

function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await forgotPassword(email);
            setIsSuccess(true);
        } catch (err) {
            console.error(err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Error al enviar el correo. Intenta de nuevo.');
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
                            src="/logo.png"
                            alt="El Mayorista Logo"
                            className="h-14 object-contain"
                        />
                    </div>

                    {!isSuccess ? (
                        <>
                            {/* Back Link */}
                            <Link
                                to="/login"
                                className="inline-flex items-center text-sm text-mayorista-text-secondary hover:text-mayorista-red transition-colors mb-6"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver al inicio de sesión
                            </Link>

                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-mayorista-text-primary mb-2">
                                    ¿Olvidaste tu contraseña?
                                </h2>
                                <p className="text-mayorista-text-secondary text-sm">
                                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-mayorista-text-primary text-sm font-semibold mb-2">
                                        Correo electrónico
                                    </label>
                                    <div className="relative flex border border-gray-200 rounded-md focus-within:border-mayorista-red focus-within:ring-1 focus-within:ring-mayorista-red">
                                        <div className="w-12 flex items-center justify-center bg-white border-r border-gray-200 rounded-l-md">
                                            <Mail className="text-mayorista-text-secondary w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="flex-1 px-4 py-3 focus:outline-none bg-white text-mayorista-text-primary placeholder:text-mayorista-text-secondary rounded-r-md"
                                            placeholder="ejemplo@elmayorista.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-mayorista-red hover:bg-opacity-90 text-white font-semibold py-3.5 rounded-md transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                                </button>
                            </form>
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
                                ¡Correo enviado!
                            </h2>

                            <p className="text-mayorista-text-secondary mb-6">
                                Hemos enviado un enlace de recuperación a <span className="font-semibold text-mayorista-text-primary">{email}</span>.
                                Revisa tu bandeja de entrada y sigue las instrucciones.
                            </p>

                            <div className="bg-mayorista-surface rounded-lg p-4 mb-6 text-left">
                                <p className="text-sm text-mayorista-text-secondary">
                                    <span className="font-semibold text-mayorista-text-primary">¿No recibes el correo?</span>
                                    <br />
                                    Revisa tu carpeta de spam o solicita un nuevo enlace.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-mayorista-red hover:bg-opacity-90 text-white font-semibold py-3.5 rounded-md transition-all shadow-sm hover:shadow-md"
                            >
                                Volver al inicio de sesión
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

export default ForgotPasswordPage;
