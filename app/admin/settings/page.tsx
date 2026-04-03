'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminSettings() {
  const [menuSettings, setMenuSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

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
      <div className="max-w-5xl mx-auto bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
        <h1 className="text-3xl font-black uppercase mb-6 border-b-4 border-black pb-2 italic italic">Master Business Control</h1>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black text-sm">
            <thead className="bg-black text-white uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-4 text-left">Food Item</th>
                <th className="p-4 text-center bg-zinc-800">Selling Price (Customer)</th>
                <th className="p-4 text-center bg-zinc-700">Vendor Cost (We Pay)</th>
                <th className="p-4 text-center bg-orange-600 text-white">Profit</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {foodItems.map((item) => {
                const sellPrice = menuSettings[item.id]?.price || 0;
                const vendorCost = menuSettings[item.id]?.cost || 0;
                const profit = sellPrice - vendorCost;

                return (
                  <tr key={item.id} className="border-b-2 border-black hover:bg-gray-50">
                    <td className="p-4 font-black uppercase italic">{item.name}</td>
                    
                    {/* පාරිභෝගිකයාට පේන මිල */}
                    <td className="p-4">
                      <input 
                        type="number" 
                        value={sellPrice} 
                        onChange={(e) => handleSave(item.id, 'price', parseFloat(e.target.value))}
                        className="w-full border-2 border-black p-2 text-right font-black focus:bg-yellow-100 outline-none"
                      />
                    </td>

                    {/* නියෝජිතයාට අපි ගෙවන මිල */}
                    <td className="p-4">
                      <input 
                        type="number" 
                        value={vendorCost} 
                        onChange={(e) => handleSave(item.id, 'cost', parseFloat(e.target.value))}
                        className="w-full border-2 border-black p-2 text-right font-black focus:bg-blue-50 outline-none text-blue-800"
                      />
                    </td>

                    {/* ලාභය ගණනය කිරීම (Auto Calc) */}
                    <td className={`p-4 text-center font-black text-lg italic ${profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      Rs. {profit.toFixed(2)}
                    </td>

                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleSave(item.id, 'isSoldOut', !menuSettings[item.id]?.isSoldOut)}
                        className={`w-full py-2 font-black uppercase border-2 border-black transition-all text-[10px] ${menuSettings[item.id]?.isSoldOut ? 'bg-red-500 text-white' : 'bg-green-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                      >
                        {menuSettings[item.id]?.isSoldOut ? 'SOLD OUT' : 'AVAILABLE'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 p-6 bg-zinc-900 text-white border-b-8 border-orange-600 rounded-xl">
          <h3 className="font-black italic text-orange-500 uppercase text-xs tracking-widest mb-2">Business Insights</h3>
          <p className="text-sm font-bold text-gray-300">
            දැන් ඔයාට පේනවා ඇති හැම කෑමකින්ම ඔයාට ඉතිරි වන ශුද්ධ ලාභය. 
            ලංකාවේ කොහේ ඕඩර් එකක් ආවත් කස්ටමර්ට පේන්නේ <span className="text-white underline">Selling Price</span> එකයි. 
            නියෝජිතයාට ලැබෙන්නේ <span className="text-white underline">Vendor Cost</span> එකයි.
          </p>
        </div>
      </div>
    </div>
  );
}