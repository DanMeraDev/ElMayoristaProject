import { useEffect, useState, useCallback } from 'react';
import { getPendingSellers, approveSeller } from '../../api/admin.api';
import { Loader2, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';

function PendingSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const loadSellers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingSellers();
      setSellers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar los vendedores pendientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await approveSeller(id);
      setSellers(prev => prev.filter(seller => seller.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al aprobar el vendedor');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando vendedores pendientes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={loadSellers}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  if (sellers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No hay vendedores pendientes de aprobacion.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Vendedores Pendientes</h1>
      <ul className="space-y-2">
        {sellers.map(seller => (
          <li
            key={seller.id}
            className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="font-medium dark:text-white">{seller.fullName || seller.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{seller.email}</p>
            </div>
            <button
              onClick={() => handleApprove(seller.id)}
              disabled={approvingId === seller.id}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              {approvingId === seller.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              Aprobar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PendingSellers;
