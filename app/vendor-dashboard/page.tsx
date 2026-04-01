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

      const q = query(collection(db, 'vendors'), 

                where("mobilePhone", "==", phone), 

                where("password", "==", password));

      

      const querySnapshot = await getDocs(q);



      if (!querySnapshot.empty) {

        const vendorData = querySnapshot.docs[0].data();

        // ලොගින් වුණාම නියෝජිතයාගේ තොරතුරු තාවකාලිකව සේව් කරගන්නවා

        localStorage.setItem('vendorId', querySnapshot.docs[0].id);

        localStorage.setItem('vendorName', vendorData.fullName);

        localStorage.setItem('vendorCity', vendorData.city);

        

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

    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100">

        <div className="text-center mb-8">

          <div className="bg-orange-500 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl mb-4 shadow-lg">👨‍🍳</div>

          <h2 className="text-2xl font-black text-gray-900 uppercase italic">Vendor Login</h2>

          <p className="text-gray-500 font-bold text-sm">Rasa.lk නියෝජිත පුවරුවට ඇතුළු වන්න</p>

        </div>



        <form onSubmit={handleLogin} className="space-y-6">

          <div>

            <label className="block text-sm font-bold text-gray-700 mb-2">ජංගම දුරකථන අංකය</label>

            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-orange-500 focus:outline-none font-bold" placeholder="07XXXXXXXX" required />

          </div>

          <div>

            <label className="block text-sm font-bold text-gray-700 mb-2">මුද්‍රිත පදය (Password)</label>

            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-orange-500 focus:outline-none font-bold" placeholder="****" required />

          </div>

          <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white font-black py-4 rounded-xl hover:bg-orange-600 transition-all uppercase tracking-widest">

            {loading ? 'සම්බන්ධ වෙමින්...' : 'ඇතුළු වන්න'}

          </button>

        </form>

      </div>

    </div>

  );

}