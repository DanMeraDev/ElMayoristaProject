import { useEffect, useState } from 'react';
import { getPendingSellers, approveSeller } from '../api/admin.api';

function PendingSellers() {
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    async function loadSellers() {
        const res = await getPendingSellers();
        setSellers(res.data);
    }
    loadSellers();
  }, []);

  const handleApprove = async (id) => {
      await approveSeller(id);
      setSellers(sellers.filter(seller => seller.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Pending Sellers</h1>
      <ul>
          {sellers.map(seller => (
              <li key={seller.id} className="bg-zinc-700 p-2 my-2 flex justify-between">
                  <span>{seller.name}</span>
                  <button onClick={() => handleApprove(seller.id)} className="bg-green-500 px-2 py-1 rounded">Approve</button>
              </li>
          ))}
      </ul>
    </div>
  );
}

export default PendingSellers;
