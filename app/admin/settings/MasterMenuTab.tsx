// FILE: app/admin/settings/MasterMenuTab.tsx

'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function MasterMenuTab() {
  const [menuItems, setMenuItems] = useState<any>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, cost: 0, nameSi: '', type: 'standard', imageUrl: '' });

  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', nameSi: '', price: '', cost: '', type: 'standard', imageUrl: '' });

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
        nameSi: newItem.nameSi.trim() || newItem.name.trim(),
        imageUrl: newItem.imageUrl.trim() || '/image_0.png' 
      };

      await setDoc(doc(db, 'settings', 'menu'), newMenuData);
      setIsAdding(false);
      setNewItem({ name: '', nameSi: '', price: '', cost: '', type: 'standard', imageUrl: '' });
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
          <form onSubmit={handleAddNewItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Name (English)</label>
              <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-4 rounded-xl font-black border-2 border-blue-100 outline-none text-xs uppercase" placeholder="FOOD NAME" />
            </div>
            <div>
              <label className="text-[9px] font-black text-orange-600 uppercase block mb-1">Name (සිංහල)</label>
              <input type="text" value={newItem.nameSi} onChange={e => setNewItem({...newItem, nameSi: e.target.value})} className="w-full p-4 rounded-xl font-black border-2 border-orange-200 outline-none text-xs" placeholder="සිංහල නම" />
            </div>
            <div>
              <label className="text-[9px] font-black text-green-600 uppercase block mb-1">Image URL (පින්තූරයේ ලින්ක් එක)</label>
              <input type="text" value={newItem.imageUrl} onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} className="w-full p-4 rounded-xl font-black border-2 border-green-200 outline-none text-[10px]" placeholder="https://image-link.com/photo.jpg" />
            </div>
            <div>
                <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Category</label>
                <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} className="w-full p-4 rounded-xl font-black border-2 border-blue-100 text-[10px] bg-white">
                    <option value="standard">Standard (Kottu/Rice)</option>
                    <option value="paratha">Curry Based (Paratha)</option>
                    <option value="standalone">Standalone (Juice/Snacks)</option>
                    <option value="biryani">Biryani</option>
                    <option value="devilled">Devilled</option>
                </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Selling Price</label>
              <input type="number" required value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full p-4 rounded-xl font-black border-2 border-blue-100 outline-none text-xs" />
            </div>
            <div>
              <label className="text-[9px] font-black text-blue-800 uppercase block mb-1">Vendor Cost</label>
              <input type="number" required value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} className="w-full p-4 rounded-xl font-black border-2 border-blue-100 outline-none text-xs" />
            </div>
            
            <div className="lg:col-span-3 flex gap-3 mt-2">
              <button type="submit" className="flex-1 bg-zinc-950 text-white font-black py-4 rounded-2xl text-xs uppercase shadow-xl hover:bg-blue-600 transition-all">Save Item</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-8 bg-white text-gray-400 font-black py-4 rounded-2xl text-xs uppercase border border-gray-100">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(menuItems).map(([id, data]: [string, any]) => (
          <div key={id} className="bg-zinc-50 p-6 rounded-[2rem] border-2 border-zinc-200 relative group overflow-hidden">
            <div className="relative w-full h-32 mb-4 rounded-2xl overflow-hidden bg-gray-200">
                <img src={data.imageUrl || '/image_0.png'} alt={id} className="w-full h-full object-cover" />
            </div>
            <div className="mb-4">
              <h4 className="font-black text-xl italic text-zinc-900 uppercase tracking-tighter leading-none mb-1">{id}</h4>
              <p className="text-[10px] font-bold text-orange-600">{data.nameSi}</p>
            </div>

            {editingItem === id ? (
              <div className="space-y-4 bg-white p-4 rounded-xl shadow-lg border border-blue-100">
                <div>
                  <label className="text-[9px] font-black text-green-600 uppercase">Image URL</label>
                  <input type="text" value={editForm.imageUrl} onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} className="w-full bg-gray-50 border-2 border-green-100 rounded-xl p-2 font-black text-[10px]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[10px] font-black uppercase">Price</label><input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} className="w-full border-2 p-2 rounded-xl" /></div>
                    <div><label className="text-[10px] font-black uppercase">Cost</label><input type="number" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: Number(e.target.value)})} className="w-full border-2 p-2 rounded-xl" /></div>
                </div>
                <button onClick={() => saveMenuItem(id)} className="w-full bg-blue-600 text-white font-black py-2 rounded-xl text-[10px] uppercase">Save Changes</button>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={() => { setEditingItem(id); setEditForm({ price: data.price, cost: data.cost, nameSi: data.nameSi || '', type: data.type || 'standard', imageUrl: data.imageUrl || '' }); }} className="w-full bg-zinc-900 text-white font-black py-3 rounded-xl text-[10px] uppercase">Edit</button>
                <button onClick={() => deleteMenuItem(id)} className="w-full text-red-500 font-black text-[9px] uppercase tracking-widest hover:underline">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}