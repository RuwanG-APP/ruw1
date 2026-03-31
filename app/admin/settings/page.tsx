// app/admin/settings/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminSettings() {
  const [menuSettings, setMenuSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // කෑම ලැයිස්තුව (මේක ඔයාගේ ඇප් එකේ තියෙන ඒවාට සමාන විය යුතුයි)
  const foodItems = [
    { id: 'kottu', name: 'Kottu' },
    { id: 'fried-rice', name: 'Fried Rice' },
    { id: 'biryani', name: 'Biryani' },
    { id: 'paratha', name: 'Paratha' },
    { id: 'devilled', name: 'Devilled' },
    { id: 'noodles', name: 'Noodles' }
  ];

  useEffect(() => {
    async function fetchData() {
      const docRef = doc(db, 'settings', 'menu');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setMenuSettings(docSnap.data());
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSave = async (id: string, field: string, value: any) => {
    const updated = { ...menuSettings, [id]: { ...menuSettings[id], [field]: value } };
    setMenuSettings(updated);
    await setDoc(doc(db, 'settings', 'menu'), updated);
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading Settings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
        <h1 className="text-3xl font-black uppercase mb-6 border-b-4 border-black pb-2">Business Control Center</h1>
        
        <table className="w-full border-collapse border-2 border-black text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="p-3 text-left">Food Item</th>
              <th className="p-3 text-center">Cost Price (Rs)</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {foodItems.map((item) => (
              <tr key={item.id} className="border-b-2 border-black">
                <td className="p-3 font-bold uppercase">{item.name}</td>
                <td className="p-3">
                  <input 
                    type="number" 
                    value={menuSettings[item.id]?.cost || 0} 
                    onChange={(e) => handleSave(item.id, 'cost', parseFloat(e.target.value))}
                    className="w-full border-2 border-black p-2 text-right font-mono focus:bg-yellow-100 outline-none"
                  />
                </td>
                <td className="p-3 text-center">
                  <button 
                    onClick={() => handleSave(item.id, 'isSoldOut', !menuSettings[item.id]?.isSoldOut)}
                    className={`px-4 py-2 font-black uppercase border-2 border-black transition-all ${menuSettings[item.id]?.isSoldOut ? 'bg-red-500 text-white' : 'bg-green-500 text-white hover:scale-95'}`}
                  >
                    {menuSettings[item.id]?.isSoldOut ? 'SOLD OUT' : 'AVAILABLE'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-600 italic text-sm">
          💡 මෙතන දාන "Cost Price" එක අනුව ඔයාගේ Daily Report එකේ නියම ලාභය (Profit) ඔටෝමැටික්ම හැදෙනවා.
        </div>
        <button onClick={() => window.location.href='/report'} className="mt-6 font-bold underline">Go to Daily Report →</button>
      </div>
    </div>
  );
}