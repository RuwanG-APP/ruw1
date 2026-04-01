'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // LocalStorage එකෙන් Vendor ID එක ගන්නවා
    const vId = localStorage.getItem('vendorId');

    if (!vId) {
      // ID එක නැත්නම් විතරක් ලොගින් එකට යවනවා
      window.location.href = '/vendor-login';
      return;
    }

    const fetchVendorData = async () => {
      try {
        const docRef = doc(db, 'vendors', vId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setVendor(docSnap.data());
        } else {
          // ඩේටාබේස් එකේ නැත්නම් ලොගවුට් කරනවා
          localStorage.removeItem('vendorId');
          window.location.href = '/vendor-login';
        }
      } catch (error) {
        console.error("Error fetching vendor:", error);
      }
      setLoading(false);
    };

    fetchVendorData();
  }, []);

  // ලෝඩ් වෙනකම් පෙන්වන ස්ක්‍රීන් එක
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center font-black animate-pulse text-orange-600 uppercase tracking-widest">
          Rasa.lk පුවරුව සූදානම් වෙමින් පවතී...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-500 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-orange-400 font-black text-xs uppercase tracking-[0.2em] mb-1">Partner Portal</p>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">ආයුබෝවන්, {vendor?.fullName}!</h1>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.href = '/vendor-login'; }} className="bg-white/10 hover:bg-red-500 text-white px-5 py-2 rounded-2xl text-xs font-black uppercase transition-all">Logout</button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <p className="text-gray-400 font-bold text-[10px] uppercase mb-2">ඔබේ තත්ත්වය</p>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 bg-green-500 rounded-full animate-ping"></span>
              <span className="text-xl font-black text-gray-900">සක්‍රීයයි (Active)</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <p className="text-gray-400 font-bold text-[10px] uppercase mb-2">නගරය</p>
            <p className="text-xl font-black text-gray-900 italic tracking-tight">{vendor?.city} - {vendor?.district}</p>
          </div>
        </div>

        {/* Orders Section Placeholder */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 text-center space-y-4">
          <div className="bg-gray-50 w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl">📦</div>
          <h2 className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase">නව ඇණවුම් නොමැත</h2>
          <p className="text-gray-400 font-bold text-sm max-w-xs mx-auto">ඔබට ඇණවුමක් ලැබුණු සැනින් මෙතැන පෙන්වනු ඇත. කරුණාකර රැඳී සිටින්න.</p>
        </div>

      </div>
    </div>
  );
}