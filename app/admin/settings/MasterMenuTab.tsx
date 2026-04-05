'use client';

import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { Loader2, UploadCloud, Edit2, Trash2, X } from 'lucide-react';

interface MenuItem {
  id: string;
  nameEn: string;
  nameSi: string;
  category: string;
  imageUrl: string;
  price: number;
  cost: number;
}

export default function MasterMenuTab() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [nameEn, setNameEn] = useState('');
  const [nameSi, setNameSi] = useState('');
  const [category, setCategory] = useState('Standard (Kottu/Rice)');
  const [imageUrl, setImageUrl] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [vendorCost, setVendorCost] = useState('');

  // 1. Firebase එකෙන් Data ටික Live ලබා ගැනීම (Real-time Fetch)
useEffect(() => {
  // 'settings/menu/items' ලෙස path එක දීම අනිවාර්යයි
  const q = query(collection(db, 'settings', 'menu', 'items'), orderBy('nameEn', 'asc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const menuData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MenuItem[];
    setItems(menuData); // දැන් අයිටම් ටික ලිස්ට් එකේ පේන්න ගනීවි
  });
  return () => unsubscribe();
}, []);

  const handleImageBrowse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `menu_images/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setImageUrl(url);
    } catch (error) {
      alert("Image upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // 2. Save හෝ Update කිරීමේ Logic එක
  const handleSaveItem = async () => {
    if (!nameEn || !sellingPrice || !vendorCost) {
      alert("Please fill all fields!");
      return;
    }

    setSaving(true);
    const itemData = {
      nameEn: nameEn.toUpperCase(),
      nameSi: nameSi,
      category: category,
      imageUrl: imageUrl,
      price: Number(sellingPrice),
      cost: Number(vendorCost),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'master_menu', editingId), itemData);
        alert("Item Updated!");
      } else {
        await addDoc(collection(db, 'master_menu'), { ...itemData, createdAt: new Date() });
        alert("Item Saved!");
      }
      resetForm();
    } catch (error) {
      alert("Operation failed!");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setNameEn(item.nameEn);
    setNameSi(item.nameSi);
    setCategory(item.category);
    setImageUrl(item.imageUrl);
    setSellingPrice(item.price.toString());
    setVendorCost(item.cost.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteDoc(doc(db, 'master_menu', id));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNameEn(''); setNameSi(''); setImageUrl('');
    setSellingPrice(''); setVendorCost('');
  };

  return (
    <div className="space-y-10">
      {/* FORM SECTION */}
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-blue-50">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black italic uppercase text-zinc-800">
            {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="text-red-500 flex items-center gap-1 font-bold text-xs uppercase">
              <X className="w-4 h-4" /> Cancel Edit
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Name (English)</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" placeholder="FOOD NAME" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Name (සිංහල)</label>
            <input value={nameSi} onChange={(e) => setNameSi(e.target.value)} className="w-full bg-orange-50/50 border border-orange-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" placeholder="සිංහල නම" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">Image (පින්තූරය)</label>
            <div className="relative">
              <input value={imageUrl} readOnly className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-5 py-4 text-[10px] outline-none pr-28" placeholder="Image URL..." />
              <label className="absolute right-2 top-2 bottom-2 bg-black text-white px-4 rounded-xl text-[10px] font-bold flex items-center cursor-pointer">
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'BROWSE'}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageBrowse} />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none cursor-pointer">
              <option>Standard (Kottu/Rice)</option>
              <option>Beverages</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Selling Price</label>
            <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-1">Vendor Cost</label>
            <input type="number" value={vendorCost} onChange={(e) => setVendorCost(e.target.value)} className="w-full bg-red-50/30 border border-red-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" placeholder="0.00" />
          </div>
        </div>

        <button 
          onClick={handleSaveItem}
          disabled={saving}
          className="w-full bg-black text-white py-5 rounded-[20px] text-xs font-black tracking-[0.3em] hover:bg-zinc-800 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UploadCloud className="w-4 h-4" /> {editingId ? 'UPDATE ITEM' : 'SAVE TO MASTER MENU'}</>}
        </button>
      </div>

      {/* ITEMS LIST SECTION */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 ml-4">Current Menu Items ({items.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-zinc-100 p-4 rounded-[30px] flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 overflow-hidden flex-shrink-0">
                {item.imageUrl && <img src={item.imageUrl} alt={item.nameEn} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-xs uppercase truncate text-zinc-800">{item.nameEn}</h4>
                <p className="text-[10px] font-bold text-zinc-400">{item.nameSi}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-[10px] font-black text-blue-600">Rs. {item.price}</span>
                  <span className="text-[10px] font-bold text-red-400">Cost: {item.cost}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleEdit(item)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}