'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function MasterMenuTab() {
  const [menuItems, setMenuItems] = useState<any>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, cost: 0 });

  useEffect(() => {
    const unsubMenu = onSnapshot(doc(db, 'settings', 'menu'), (docSnap) => {
      if (docSnap.exists()) setMenuItems(docSnap.data());
    });
    return () => unsubMenu();
  }, []);

  const saveMenuItem = async (itemId: string) => {
    try {
      const newMenuData = { ...menuItems };
      newMenuData[itemId] = { ...newMenuData[itemId], ...editForm };
      await setDoc(doc(db, 'settings', 'menu'), newMenuData);
      setEditingItem(null);
      alert("මිල සාර්ථකව යාවත්කාලීන විය!");
    } catch (err) {
      alert("Error saving item.");
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border-t-8 border-zinc-900 animate-in fade-in duration-300 uppercase">
      <h3 className="text-2xl font-black italic tracking-tighter mb-8 border-b-2 border-gray-100 pb-4">Global Menu Pricing (System Wide)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(menuItems).map(([id, data]: [string, any]) => (
          <div key={id} className="bg-zinc-50 p-6 rounded-[2rem] border-2 border-zinc-200 hover:border-blue-400 transition-all relative group overflow-hidden">
            <div className="mb-4">
              <h4 className="font-black text-xl italic text-zinc-900 uppercase tracking-tighter">{id}</h4>
            </div>

            {editingItem === id ? (
              <div className="space-y-4 relative z-10 bg-white p-4 rounded-xl shadow-lg border border-blue-100">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase">Selling Price</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} className="w-full bg-gray-50 border-2 border-blue-200 rounded-xl p-3 font-black outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase">Vendor Payout (Cost)</label>
                  <input type="number" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: Number(e.target.value)})} className="w-full bg-gray-50 border-2 border-blue-200 rounded-xl p-3 font-black text-blue-600 outline-none focus:border-blue-500" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => saveMenuItem(id)} className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl text-[10px] uppercase shadow-md hover:bg-blue-700">Save</button>
                  <button onClick={() => setEditingItem(null)} className="flex-1 bg-gray-200 text-gray-600 font-black py-3 rounded-xl text-[10px] uppercase hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Selling Price:</span>
                  <span className="font-black text-lg">Rs.{data.price}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
                  <span className="text-[10px] font-black text-blue-800 uppercase">Vendor Cost:</span>
                  <span className="font-black text-lg text-blue-600">Rs.{data.cost}</span>
                </div>
                <button 
                  onClick={() => { setEditingItem(id); setEditForm({ price: data.price, cost: data.cost }); }}
                  className="w-full bg-zinc-900 text-white font-black py-3 rounded-xl text-[10px] uppercase mt-4 hover:bg-orange-600 transition-all opacity-0 group-hover:opacity-100 absolute bottom-6 left-0 right-0 mx-6 shadow-xl"
                  style={{ width: 'calc(100% - 3rem)' }}
                >
                  Edit Prices
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}