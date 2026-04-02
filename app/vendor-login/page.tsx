'use client';
import { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function VendorLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const inputPhone = phone.trim();
      const inputPass = password.trim();

      console.log("Checking for:", inputPhone, inputPass);

      // 1. මුලින්ම බලමු මේ ෆෝන් නම්බර් එක තියෙන කෙනෙක් ඉන්නවද කියලා (Status එක නැතුව)
      const q = query(
        collection(db, 'vendors'),
        where('phone', '==', inputPhone)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // වැදගත්: මෙතනදී "Number" එකක් විදිහටත් චෙක් කරලා බලමු
        alert("මේ දුරකථන අංකය පද්ධතියේ නැත. Firebase එකේ අංකය String එකක්ද කියා බලන්න.");
      } else {
        const vendorDoc = querySnapshot.docs[0].data();
        
        // 2. විස්තර මැච් කරලා බලමු
        if (vendorDoc.password !== inputPass) {
          alert("මුරපදය වැරදියි!");
        } else if (vendorDoc.status !== 'APPROVED') {
          alert(`ඔබ තවම අනුමත වී නැත! (Status: ${vendorDoc.status})`);
        } else {
          // සියල්ල හරි නම්!
          localStorage.setItem('vendorPhone', inputPhone);
          window.location.href = '/vendor-dashboard';
        }
      }
    } catch (err) {
      alert("Error: " + err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-600">
        <div className="text-center mb-8">
           <h2 className="text-3xl font-black italic tracking-tighter text-zinc-900 uppercase">VENDOR LOGIN</h2>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Rasa.lk Partner Portal</p>
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