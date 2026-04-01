// Ruwan Login Page
'use client';

import { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function VendorLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ඩේටාබේස් එකේ vendors ලිස්ට් එක පරීක්ෂා කිරීම
      const q = query(collection(db, 'vendors'), 
                where("mobilePhone", "==", phone), 
                where("password", "==", password));
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const vendorDoc = querySnapshot.docs[0];
        localStorage.setItem('vendorId', vendorDoc.id);
        // සාර්ථකව ලොග් වුණොත් ඩෑෂ්බෝඩ් එකට යවනවා
        window.location.href = '/vendor-dashboard';
      } else {
        alert("දුරකථන අංකය හෝ මුද්‍රිත පදය (Password) වැරදියි!");
      }
    } catch (error) {
      alert("Error logging in: " + error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-gray-50">
        <div className="text-center mb-10">
          {/* Chef Icon */}
          <div className="bg-zinc-900 w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl mb-4 shadow-xl border-b-4 border-orange-500">👨‍🍳</div>
          <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">Vendor Login</h2>
          <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest">Rasa.lk Partner Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase ml-1">Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-orange-500 focus:outline-none font-bold text-lg bg-gray-50 transition-all" placeholder="07XXXXXXXX" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase ml-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-orange-500 focus:outline-none font-bold text-lg bg-gray-50 transition-all" placeholder="••••" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white font-black py-5 rounded-2xl hover:bg-orange-700 transition-all shadow-lg text-lg uppercase tracking-widest mt-4">
            {loading ? 'Verifying...' : 'LOG IN NOW'}
          </button>
        </form>
      </div>
    </div>
  );
}