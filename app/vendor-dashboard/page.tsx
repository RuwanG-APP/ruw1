'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<any>(null);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const vId = localStorage.getItem('vendorId');
    if (!vId) {
      window.location.href = '/vendor-login';
      return;
    }

    const fetchVendor = async () => {
      const docSnap = await getDoc(doc(db, 'vendors', vId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setVendor(data);

        // Trial ඉතිරි දින ගණන සෙවීම
        const end = data.trialEndDate.toDate();
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
        setDaysLeft(diff > 0 ? diff : 0);
      }
    };
    fetchVendor();
  }, []);

  if (!vendor) return <div className="p-10 text-center font-bold">පූරණය වෙමින් පවතී...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <div className="bg-zinc-900 p-6 text-white flex justify-between items-center shadow-xl border-b-4 border-orange-500">
        <div>
          <h1 className="text-xl font-black italic uppercase">Rasa.lk Vendor</h1>
          <p className="text-xs text-orange-400 font-bold">Welcome, {vendor.fullName}</p>
        </div>
        <button onClick={() => {localStorage.clear(); window.location.href='/vendor-login'}} className="text-xs font-bold border border-gray-600 px-3 py-1 rounded-lg">Logout</button>
      </div>

      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        
        {/* Trial Status Card */}
        <div className={`p-6 rounded-3xl shadow-lg mb-8 text-white flex justify-between items-center ${daysLeft > 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-red-600'}`}>
          <div>
            <h2 className="text-lg font-black uppercase">Trial Period Status</h2>
            <p className="text-sm font-bold opacity-80">ඔබේ නොමිලේ අත්හදා බැලීමේ කාලය</p>
          </div>
          <div className="text-center">
            <span className="text-4xl font-black">{daysLeft}</span>
            <p className="text-[10px] font-bold uppercase">Days Left</p>
          </div>
        </div>

        {daysLeft === 0 && !vendor.isPaid && (
          <div className="bg-yellow-100 border-2 border-yellow-400 p-6 rounded-3xl mb-8 text-center">
            <h3 className="text-yellow-800 font-black text-xl mb-2">⚠️ කාලය අවසන්!</h3>
            <p className="text-yellow-700 font-bold mb-4">ඔබේ නොමිලේ ලබාදුන් සති 2ක කාලය අවසන් වී ඇත. ඉදිරියට ඕඩර් ලබා ගැනීමට කරුණාකර රෙජිස්ට්‍රේෂන් ගාස්තු ගෙවා තහවුරු කරන්න.</p>
            <button className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-black uppercase">ගෙවීම් සිදු කරන්න</button>
          </div>
        )}

        {/* Dashboard Menu Items (Placeholder for now) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-gray-50 flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-500 transition-all">
             <div className="text-4xl mb-3">🍔</div>
             <h3 className="font-black text-gray-800 uppercase">නව ඇණවුම් (New Orders)</h3>
             <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black mt-2">Coming Soon</span>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-gray-50 flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-500 transition-all">
             <div className="text-4xl mb-3">💰</div>
             <h3 className="font-black text-gray-800 uppercase">මගේ ආදායම (My Earnings)</h3>
             <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black mt-2">Coming Soon</span>
          </div>
        </div>

      </div>
    </div>
  );
}