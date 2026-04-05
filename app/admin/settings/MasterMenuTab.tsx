'use client';

import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore'; // Firestore එකට save කරන්න මේක ඕනේ
import { db, storage } from '../../firebase';
import { Loader2, UploadCloud } from 'lucide-react';

export default function MasterMenuTab() {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // සියලුම දත්ත සඳහා States
  const [nameEn, setNameEn] = useState('');
  const [nameSi, setNameSi] = useState('');
  const [category, setCategory] = useState('Standard (Kottu/Rice)');
  const [imageUrl, setImageUrl] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [vendorCost, setVendorCost] = useState('');

  // 1. Image එක Browse කරලා Upload කරන කොටස
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

  // 2. දත්ත ටික Firebase එකට Save කරන කොටස (මෙතනයි Profit එක තීරණය වෙන්නේ)
  const handleSaveItem = async () => {
    if (!nameEn || !sellingPrice || !vendorCost) {
      alert("කරුණාකර නම, විකුණුම් මිල සහ වියදම ඇතුළත් කරන්න!");
      return;
    }

    setSaving(true);
    try {
      // දත්ත Firebase එකේ 'master_menu' කියන collection එකට දානවා
      await addDoc(collection(db, 'master_menu'), {
        nameEn: nameEn.toUpperCase(),
        nameSi: nameSi,
        category: category,
        imageUrl: imageUrl,
        price: Number(sellingPrice), // අනිවාර්යයෙන් Number එකක් විය යුතුයි
        cost: Number(vendorCost),   // අනිවාර්යයෙන් Number එකක් විය යුතුයි
        createdAt: new Date()
      });

      alert("අයිටම් එක සාර්ථකව සේව් කළා!");
      
      // Form එක Clear කිරීම
      setNameEn(''); setNameSi(''); setImageUrl('');
      setSellingPrice(''); setVendorCost('');
    } catch (error) {
      console.error("Save error:", error);
      alert("දත්ත සේව් කිරීම අසාර්ථකයි!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-blue-50">
        <h2 className="text-xl font-black italic uppercase mb-8 text-zinc-800">GLOBAL MENU PRICING</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Name English */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Name (English)</label>
            <input 
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-400 transition-all" 
              placeholder="FOOD NAME" 
            />
          </div>

          {/* Name Sinhala */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Name (සිංහල)</label>
            <input 
              value={nameSi}
              onChange={(e) => setNameSi(e.target.value)}
              className="w-full bg-orange-50/50 border border-orange-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-orange-400 transition-all" 
              placeholder="සිංහල නම" 
            />
          </div>

          {/* Image Browse */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">Image (පින්තූරය)</label>
            <div className="relative">
              <input 
                type="text" value={imageUrl} readOnly 
                className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-5 py-4 text-[10px] outline-none pr-28" 
                placeholder="Image URL..." 
              />
              <label className="absolute right-2 top-2 bottom-2 bg-black text-white px-4 rounded-xl text-[10px] font-bold flex items-center cursor-pointer">
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'BROWSE'}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageBrowse} />
              </label>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none cursor-pointer"
            >
              <option>Standard (Kottu/Rice)</option>
              <option>Beverages</option>
            </select>
          </div>

          {/* Selling Price */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Selling Price (විකුණුම් මිල)</label>
            <input 
              type="number" value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" 
              placeholder="0.00"
            />
          </div>

          {/* Vendor Cost */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-1">Vendor Cost (වියදම)</label>
            <input 
              type="number" value={vendorCost}
              onChange={(e) => setVendorCost(e.target.value)}
              className="w-full bg-red-50/30 border border-red-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" 
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleSaveItem}
            disabled={saving}
            className="flex-1 bg-black text-white py-5 rounded-[20px] text-xs font-black tracking-[0.3em] hover:bg-zinc-800 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UploadCloud className="w-4 h-4" /> SAVE TO MASTER MENU</>}
          </button>
          <button className="px-10 bg-white text-zinc-400 border border-zinc-100 py-5 rounded-[20px] text-xs font-black tracking-widest hover:bg-zinc-50 transition-all uppercase">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}