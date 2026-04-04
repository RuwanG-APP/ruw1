'use client';

// ෆයිල් එකේ උඩම තියෙන import එක මේ විදිහට වෙනස් කරන්න
import MasterMenuTab from './settings/MasterMenuTab';

import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase'; 
import { Loader2, UploadCloud } from 'lucide-react';

export default function MasterMenuTab() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-blue-50">
        <h2 className="text-xl font-black italic uppercase mb-8 text-zinc-800">GLOBAL MENU PRICING</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Name English */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Name (English)</label>
            <input className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-400 transition-all" placeholder="FOOD NAME" />
          </div>

          {/* Name Sinhala */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Name (සිංහල)</label>
            <input className="w-full bg-orange-50/50 border border-orange-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-orange-400 transition-all" placeholder="සිංහල නම" />
          </div>

          {/* Image URL with BROWSE Button */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">Image URL (පින්තූරය තෝරන්න)</label>
            <div className="relative group">
              <input 
                type="text" 
                value={imageUrl} 
                readOnly 
                className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-5 py-4 text-[10px] font-medium text-zinc-500 outline-none pr-32" 
                placeholder="https://image-link.com/photo.jpg" 
              />
              <label className="absolute right-2 top-2 bottom-2 bg-zinc-900 hover:bg-black text-white px-5 rounded-xl text-[10px] font-black flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'BROWSE'}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageBrowse} />
              </label>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Category</label>
            <select className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none cursor-pointer">
              <option>Standard (Kottu/Rice)</option>
              <option>Beverages</option>
            </select>
          </div>

          {/* Selling Price */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Selling Price</label>
            <input type="number" className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-400" placeholder="0.00" />
          </div>

          {/* Vendor Cost */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Vendor Cost</label>
            <input type="number" className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-400" placeholder="0.00" />
          </div>
        </div>

        <div className="flex gap-4">
          <button className="flex-1 bg-black text-white py-5 rounded-[20px] text-xs font-black tracking-[0.3em] hover:bg-zinc-800 transition-all shadow-xl flex items-center justify-center gap-3">
            <UploadCloud className="w-4 h-4" /> SAVE ITEM
          </button>
          <button className="px-10 bg-white text-zinc-400 border border-zinc-100 py-5 rounded-[20px] text-xs font-black tracking-widest hover:bg-zinc-50 transition-all uppercase">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}