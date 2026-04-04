// FILE: app/admin/settings/MasterMenuTab.tsx

'use client';

import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase'; // ඔබේ firebase config එක මෙහි ඇති බව සහතික කරගන්න
import { Loader2, Check, Image as ImageIcon } from 'lucide-react';

export default function MasterMenuTab() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // 1. පෙන් එකෙන් හෝ මැෂින් එකෙන් ඉමේජ් එකක් තෝරා අප්ලෝඩ් කරන ෆන්ක්ෂන් එක
  const handleImageBrowse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Firebase Storage එකේ 'menu_images' කියන ෆෝල්ඩර් එකට සේව් කරනවා
      const storageRef = ref(storage, `menu_images/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      
      // අප්ලෝඩ් වුනාට පස්සේ ඒකේ ලින්ක් එක (URL) ලබා ගැනීම
      const downloadURL = await getDownloadURL(snapshot.ref);
      setImageUrl(downloadURL); // ලින්ක් එක ස්ටේට් එකට දානවා
    } catch (error) {
      console.error("Upload error:", error);
      alert("ඉමේජ් එක අප්ලෝඩ් කිරීම අසාර්ථකයි!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
        <h2 className="text-red-600 text-[10px] font-black italic tracking-[0.3em] mb-6 uppercase">
          Add New Menu Item
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Item Name</label>
            <input className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-red-600" placeholder="CHICKEN KOTTU" />
          </div>

          {/* Image Browse Section - මෙන්න ඔයා ඉල්ලපු කොටස */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-green-500 uppercase tracking-widest ml-1">
              Item Image (Browse from Machine/USB)
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={imageUrl} 
                  readOnly
                  placeholder="Image URL will appear here..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-zinc-500 outline-none"
                />
                {imageUrl && <Check className="absolute right-3 top-3 text-green-500 w-4 h-4" />}
              </div>

              {/* ඇත්තම Browse බටන් එක */}
              <label className="bg-red-600 hover:bg-red-700 text-white px-6 rounded-xl text-[10px] font-black flex items-center justify-center cursor-pointer transition-all active:scale-95 whitespace-nowrap min-w-[120px]">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> BROWSE
                  </div>
                )}
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageBrowse} 
                />
              </label>
            </div>
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1">Selling Price</label>
            <input type="number" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-red-600" placeholder="0.00" />
          </div>
        </div>

        <button className="w-full mt-10 bg-white text-black py-4 rounded-2xl text-[11px] font-black tracking-[0.3em] hover:bg-zinc-200 transition-all shadow-lg">
          SAVE TO MASTER MENU
        </button>
      </div>
    </div>
  );
}