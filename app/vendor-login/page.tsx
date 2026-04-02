'use client';
import { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function VendorLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    try {
      // 1. වෙන්ඩර්ව සෙවීම (Phone + Password + Approved Status)
      const q = query(
        collection(db, 'vendors'),
        where('phone', '==', phone.trim()),
        where('password', '==', password.trim()),
        where('status', '==', 'APPROVED')
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 2. සාර්ථක නම් ෆෝන් එක මතක තබා ගෙන ඩෑෂ්බෝඩ් එකට යැවීම
        localStorage.setItem('vendorPhone', phone.trim());
        window.location.href = '/vendor-dashboard';
      } else {
        // 3. අසාර්ථක නම් Alert එකක් සහ Shake effect එක
        setError(true);
        alert("ලොගින් විස්තර වැරදියි හෝ ඔබව තවම අනුමත කර නැත.");
      }
    } catch (err) {
      alert("දෝෂයක් සිදු විය. නැවත උත්සාහ කරන්න.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 font-sans">
      <div className={`sm:mx-auto sm:w-full sm:max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-600 transition-all ${error ? 'animate-bounce border-red-500' : ''}`}>
        <div className="text-center mb-8">
           <h2 className="text-3xl font-black italic tracking-tighter text-zinc-900 uppercase">VENDOR LOGIN</h2>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rasa.lk Partner Portal</p>
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="PHONE NUMBER" required className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:border-orange-500" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="PASSWORD" required className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:border-orange-500" />
          <button type="submit" disabled={isLoading} className="w-full bg-orange-600 text-white font-black py-5 rounded-3xl shadow-lg hover:bg-zinc-900 transition-all uppercase tracking-widest text-xs">
            {isLoading ? 'VERIFYING...' : 'LOG IN NOW'}
          </button>
        </form>
      </div>
    </div>
  );
}