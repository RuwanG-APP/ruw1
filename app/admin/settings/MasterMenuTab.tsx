'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function MasterMenuTab() {
  const [menuItems, setMenuItems] = useState<any>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, cost: 0 });

  // States for adding a new item
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', cost: '' });

  useEffect(() => {
    const unsubMenu = onSnapshot(doc(db, 'settings', 'menu'), (docSnap) => {
      if (docSnap.exists()) setMenuItems(docSnap.data());
    });
    return () => unsubMenu();
  }, []);

  // Function to save/update an existing item
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

  // Function to add a completely new item to the menu
  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.cost) {
      alert("කරුණාකර සියලු විස්තර පුරවන්න.");
      return;
    }

    const itemKey = newItem.name.trim().toUpperCase(); // කෑමේ නම Key එක විදිහට ගන්නවා

    try {
      const newMenuData = { ...menuItems };
      newMenuData[itemKey] = {
        price: Number(newItem.price),
        cost: Number(newItem.cost)
      };

      await setDoc(doc(db, 'settings', 'menu'), newMenuData);
      setIsAdding(false);
      setNewItem({ name: '', price: '', cost: '' });
      alert("අලුත් කෑම වර්ගය සාර්ථකව ඇතුළත් කළා! ✅");
    } catch (err) {
      alert("Error adding new item.");
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border-t-8 border-zinc-900 animate-in fade-in duration-300 uppercase">
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b-2 border-gray-100 pb-4 gap-4">
        <h3 className="text-2xl font-black italic tracking-tighter">Global Menu Pricing</h3>
        
        {/* + Add New Item Button */}
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest hover:bg-zinc-900 transition-all shadow-lg flex items-center gap-2"
          >
            <span className="text-lg">+</span> Add New Menu Item
          </button>
        )}
      </div>

      {/* Form to add a NEW item */}
      {isAdding && (
        <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-200 mb-8 animate-in zoom-in duration-200">
          <h4 className="font-black text-xl italic mb-6 text-blue-900 tracking-tighter uppercase">Add New Food Item</h4>
          <form onSubmit={handleAddNewItem} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Item Name (e.g. FISH BUN)</label>
              <input 
                type="text" 
                required
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                className="w-full p-4 rounded-xl font-black border-2 border-blue-100 focus:border-blue-500 outline-none uppercase"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Selling Price (Customer)</label>
              <input 
                type="number" 
                required
                value={newItem.price}
                onChange={e => setNewItem({...newItem, price: e.target.value})}
                className="w-full p-4 rounded-xl font-black border-2 border-blue-100 focus:border-blue-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Vendor Payout (Cost)</label>
              <input 
                type="number" 
                required
                value={newItem.cost}
                onChange={e => setNewItem({...newItem, cost: e.target.value})}
                className="w-full p-4 rounded-xl font-black border-2 border-blue-100 focus:border-blue-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-3 flex gap-3 mt-2">
              <button type="submit" className="flex-1 bg-zinc-950 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Save To System</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-8 bg-white text-gray-400 font-black py-4 rounded-2xl text-xs uppercase hover:bg-red-50 hover:text-red-600 border border-gray-100 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items List */}
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
                  <button onClick={() => saveMenuItem(id)} className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all">Save</button>
                  <button onClick={() => setEditingItem(null)} className="flex-1 bg-gray-200 text-gray-600 font-black py-3 rounded-xl text-[10px] uppercase hover:bg-gray-300 transition-all">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Selling Price:</span>
                  <span className="font-black text-lg font-sans tracking-tighter">Rs.{data.price}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
                  <span className="text-[10px] font-black text-blue-800 uppercase">Vendor Cost:</span>
                  <span className="font-black text-lg text-blue-600 font-sans tracking-tighter">Rs.{data.cost}</span>
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