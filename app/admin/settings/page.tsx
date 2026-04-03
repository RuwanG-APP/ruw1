'use client';
import { useState } from 'react';
import PriceRequestsTab from './PriceRequestsTab';
import MasterMenuTab from './MasterMenuTab';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'MENU'>('REQUESTS');

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans uppercase">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto bg-zinc-950 text-white p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-red-600 mb-8">
        <h1 className="text-[10px] font-black tracking-[0.4em] text-red-500 mb-2 italic">Owner Control Panel</h1>
        <h2 className="text-4xl font-black italic tracking-tighter">MASTER SETTINGS</h2>
      </div>

      {/* Tabs Menu */}
      <div className="max-w-6xl mx-auto flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('REQUESTS')} 
          className={`flex-1 py-5 rounded-[2rem] font-black text-xs tracking-widest transition-all ${activeTab === 'REQUESTS' ? 'bg-red-600 text-white shadow-xl' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
        >
          මිල ඉල්ලීම් (Vendor Requests)
        </button>
        <button 
          onClick={() => setActiveTab('MENU')} 
          className={`flex-1 py-5 rounded-[2rem] font-black text-xs tracking-widest transition-all ${activeTab === 'MENU' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
        >
          ප්‍රධාන මෙනුව (Master Menu)
        </button>
      </div>

      {/* Render Components based on Active Tab */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'REQUESTS' && <PriceRequestsTab />}
        {activeTab === 'MENU' && <MasterMenuTab />}
      </div>
      
    </div>
  );
}