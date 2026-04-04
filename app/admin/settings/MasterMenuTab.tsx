'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function MasterMenuTab() {
  const [menuItems, setMenuItems] = useState<any>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, cost: 0, nameSi: '', type: 'standard' });

  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', nameSi: '', price: '', cost: '', type: 'standard' });

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
      alert("සාර්ථකව යාවත්කාලීන විය! ✅");
    } catch (err) {
      alert("Error saving item.");
    }
  };

  // 🗑️ අලුත් Delete Function එක!
  const deleteMenuItem = async (itemId: string) => {
    if (!window.confirm(`ඔබට විශ්වාසද '${itemId}' මෙනුවෙන් ඉවත් කිරීමට අවශ්‍යයි කියා?`)) return;
    try {
      const newMenuData = { ...menuItems };
      delete newMenuData[itemId];
      await setDoc(doc(db, 'settings', 'menu'), newMenuData);
      alert("සාර්ථකව ඉවත් කරන ලදී! 🗑️");
    } catch (err) {
      alert("Error deleting item.");
    }
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.cost) {
      alert("කරුණාකර සියලු විස්තර පුරවන්න.");
      return;
    }

    const itemKey = newItem.name.trim().toUpperCase();

    try {
      const newMenuData = { ...menuItems };
      newMenuData[itemKey] = {
        price: Number(newItem.price),
        cost: Number(newItem.cost),
        type: newItem.type,
        nameSi: newItem.nameSi.trim() || newItem.name.trim()
      };

      await setDoc(doc(db, 'settings', 'menu'), newMenuData);
      setIsAdding(false);
      setNewItem({ name: '', nameSi: '', price: '', cost: '', type: 'standard' });
      alert("අලුත් කෑම වර්ගය සාර්ථකව ඇතුළත් කළා! ✅");
    } catch (err) {
      alert("Error adding new item.");
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border-t-8 border-zinc-900 animate-in fade-in duration-300 uppercase">
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b-2 border-gray-100 pb-4 gap-4">
        <h3 className="text-2xl font-black italic tracking-tighter">Global Menu Pricing</h3>
        
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest hover:bg-zinc-900 transition-all shadow-lg flex items-center gap-2"
          >
            <span className="text-lg">+</span> Add New Menu Item
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-200 mb-8 animate-in zoom-in duration-200">
          <h4 className="font-black text-xl italic mb-6 text-blue-900 tracking-tighter uppercase">Add New Food Item</h4>
          
          <form onSubmit={handleAddNewItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Name (English)</label>
              <input 
                type="text" required value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                className="w-full p-4 rounded-xl font-black border-2 border-blue-100 focus:border-blue-500 outline-none uppercase text-xs"
                placeholder="FRUIT JUICE"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-orange-600 uppercase block mb-1">Name (සිංහල)</label>
              <input 
                type="text" value={newItem.nameSi}
                onChange={e => setNewItem({...newItem, nameSi: e.target.value})}
                className="w-full p-4 rounded-xl font-black border-2 border-orange-200 focus:border-orange-500 outline-none text-xs"
                placeholder="ෆෘට් ජූස්"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Category</label>
              <select 
                value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})}
                className="w-full p-4 rounded-xl font-black border-2 border-blue-100 focus:border-blue-500 outline-none uppercase text-[10px] text-blue-900 bg-white"
              >
                <option value="standard">Standard (ප්‍රධාන)</option>
                <option value="paratha">Curry Based (හොදි)</option>
                <option value="standalone">Standalone (තනි)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Selling Price</label>
              <input 
                type="number" required value={newItem.price}
                onChange={e => setNewItem({...newItem, price: e.target.value})}
                className="w-full p-4 rounded-xl font-black border-2 border-blue-100 focus:border-blue-500 outline-none text-xs"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Vendor Cost</label>
              <input 
                type="number" required value={newItem.cost}
                onChange={e => setNewItem({...newItem, cost: e.target.value})}
                className="w-full p-4 rounded-xl font-black border-2 border-blue-100 focus:border-blue-500 outline-none text-xs"
                placeholder="0.00"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-5 flex gap-3 mt-2">
              <button type="submit" className="flex-1 bg-zinc-950 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Save Item</button>
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
              <h4 className="font-black text-xl italic text-zinc-900 uppercase tracking-tighter leading-none mb-2">{id}</h4>
              <span className="bg-blue-100 text-blue-800 text-[8px] px-3 py-1 rounded-full uppercase tracking-widest font-black mr-2">
                {data.type === 'standalone' ? '🟢 STANDALONE' : data.type === 'paratha' ? '🟡 CURRY BASED' : '🔵 STANDARD'}
              </span>
              {data.nameSi && <span className="text-[10px] font-bold text-orange-600">{data.nameSi}</span>}
            </div>

            {editingItem === id ? (
              <div className="space-y-4 relative z-10 bg-white p-4 rounded-xl shadow-lg border border-blue-100">
                {/* 🛡️ Edit ෆෝම් එකටත් දැන් සිංහල නම සහ Category එක දැම්මා */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-orange-600 uppercase">Name (සිංහල)</label>
                    <input type="text" value={editForm.nameSi} onChange={e => setEditForm({...editForm, nameSi: e.target.value})} className="w-full bg-gray-50 border-2 border-orange-200 rounded-xl p-3 font-black outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-blue-800 uppercase">Category</label>
                    <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} className="w-full bg-gray-50 border-2 border-blue-200 rounded-xl p-3 font-black text-[10px] outline-none focus:border-blue-500">
                      <option value="standard">Standard</option>
                      <option value="paratha">Curry Based</option>
                      <option value="standalone">Standalone</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase">Selling Price</label>
                    <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} className="w-full bg-gray-50 border-2 border-blue-200 rounded-xl p-3 font-black outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase">Vendor Cost</label>
                    <input type="number" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: Number(e.target.value)})} className="w-full bg-gray-50 border-2 border-blue-200 rounded-xl p-3 font-black text-blue-600 outline-none focus:border-blue-500" />
                  </div>
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
                
                {/* 🛡️ Edit සහ Delete Buttons */}
                <div className="flex gap-2 w-full absolute bottom-6 left-0 right-0 mx-6 opacity-0 group-hover:opacity-100 transition-all shadow-xl" style={{ width: 'calc(100% - 3rem)' }}>
                  <button 
                    onClick={() => { setEditingItem(id); setEditForm({ price: data.price, cost: data.cost, nameSi: data.nameSi || '', type: data.type || 'standalone' }); }}
                    className="flex-[3] bg-zinc-900 text-white font-black py-3 rounded-xl text-[10px] uppercase hover:bg-orange-600 transition-all"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteMenuItem(id)}
                    className="flex-1 bg-red-100 text-red-600 font-black py-3 rounded-xl text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
                    title="Delete Item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}