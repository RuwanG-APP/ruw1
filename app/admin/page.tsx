'use client';

import MasterMenuTab from './settings/MasterMenuTab';

import { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import PriceRequestsTab from './settings/PriceRequestsTab';

export default function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MENU' | 'REQUESTS'>('DASHBOARD');
  const [stats, setStats] = useState({ orders: 0, revenue: 0, profit: 0 });

  useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const q = query(collection(db, "orders"), where("createdAt", ">=", today));
    const unsub = onSnapshot(q, (snapshot) => {
      let totalRev = 0;
      let totalProfit = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const stat = data.status.toLowerCase();
        const orderTotal = Number(data.totalAmount || data.totalPrice || 0);

        // 🛡️ Cancelled Orders වල ලොජික් එක (Cancellation Fee එක ලාභයට එකතු කිරීම)
        if (stat.includes('cancel')) {
          totalProfit += (orderTotal * 0.15); 
          totalRev += (orderTotal * 0.15); // Revenue එකටත් ඒක එකතු වෙන්න ඕනේ
        } 
        // 🛡️ සාමාන්‍ය (Active/Completed) Orders වල ලොජික් එක
        else {
          totalRev += orderTotal;
          
          if (data.adminProfit !== undefined && data.adminProfit !== null) {
            totalProfit += Number(data.adminProfit);
          } else {
            totalProfit += Math.round((Number(data.subTotal) || 0) * 0.15);
          }
        }
      });
      setStats({ orders: snapshot.size, revenue: totalRev, profit: totalProfit });
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 font-sans uppercase">
      
      <div className="bg-zinc-950 text-white p-6 shadow-xl border-b-4 border-red-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-[10px] font-black tracking-[0.5em] text-red-500 italic uppercase">Week Out Master Hub</h1>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Admin Control Center</h2>
          </div>
          
          <div className="flex bg-zinc-800 p-1 rounded-2xl border border-zinc-700 overflow-x-auto max-w-full">
            {['DASHBOARD', 'MENU', 'REQUESTS'].map((tab: any) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border-b-8 border-blue-500 transform hover:scale-105 transition-transform">
                <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Today's Active Orders</p>
                <h3 className="text-5xl font-black italic text-zinc-900">{stats.orders}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border-b-8 border-green-500 transform hover:scale-105 transition-transform">
                <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Total Revenue (Gross)</p>
                <h3 className="text-5xl font-black italic text-zinc-900">Rs. {stats.revenue.toFixed(2)}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border-b-8 border-orange-500 transform hover:scale-105 transition-transform">
                <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Net Admin Profit 💰</p>
                <h3 className="text-5xl font-black italic text-orange-600">Rs. {stats.profit.toFixed(2)}</h3>
              </div>
            </div>
            
            <div className="bg-zinc-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden min-h-[200px] flex items-center">
               <div className="relative z-10">
                  <h4 className="text-2xl font-black italic tracking-tighter mb-2">Live Business Status</h4>
                  <p className="text-zinc-400 text-xs font-bold leading-relaxed max-w-md">
                    ඔබගේ සියලුම ශාඛා වල අද දින විකුණුම් වාර්තා සහ ශුද්ධ ලාභය මෙතැනින් සජීවීව බලාගත හැක. දත්ත තත්පරයෙන් තත්පරයට යාවත්කාලීන වේ.
                  </p>
               </div>
               <div className="absolute right-[-20px] bottom-[-20px] text-[120px] md:text-[180px] font-black text-white/5 italic select-none pointer-events-none">WEEKOUT</div>
            </div>
          </div>
        )}

        {activeTab === 'MENU' && (
          <div className="animate-in fade-in duration-500">
            <MasterMenuTab />
          </div>
        )}

        {activeTab === 'REQUESTS' && (
          <div className="animate-in fade-in duration-500">
            <PriceRequestsTab />
          </div>
        )}

      </main>
    </div>
  );
}