'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ApplicationsManager() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'vendor_applications'), orderBy('appliedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApps(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (app: any, newStatus: string) => {
    const msg = lang === 'en' ? `Do you want to ${newStatus} this application?` : `මෙම අයදුම්පත ${newStatus} කිරීමට ඔබට අවශ්‍යද?`;
    if (window.confirm(msg)) {
      try {
        // 1. ඇප්ලිකේෂන් ස්ටේටස් එක වෙනස් කිරීම
        await updateDoc(doc(db, 'vendor_applications', app.id), { status: newStatus });

        // 2. Approve වුණොත් නියෝජිත ලිස්ට් එකට එකතු කිරීම
        if (newStatus === 'Approved') {
          const password = app.nic.slice(-4); // NIC අන්තිම 4 තමයි පාස්වර්ඩ් එක
          await addDoc(collection(db, 'vendors'), {
            fullName: app.fullName,
            mobilePhone: app.mobilePhone,
            nic: app.nic,
            district: app.district,
            city: app.city,
            bestFoods: app.bestFoods,
            password: password,
            isPaid: false,
            approvedAt: serverTimestamp(),
            trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // දවස් 14ක් ට්‍රයල්
          });
          alert(`සාර්ථකයි! නියෝජිතයා ඇතුළත් කරන ලදී. මුද්‍රිත පදය (Password): ${password}`);
        }
      } catch (error) {
        alert("Error: " + error);
      }
    }
  };

  const lang = 'si'; // Default Sinhala for manager

  if (loading) return <div className="p-10 text-center font-bold">ඩේටා ලෝඩ් වෙමින් පවතී...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-zinc-900 p-6 rounded-2xl shadow-lg border-b-4 border-orange-500">
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Vendor Manager</h1>
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-black">{apps.length} Total</span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {apps.map((app) => (
            <div key={app.id} className={`bg-white p-6 rounded-3xl shadow-sm border-l-8 transition-all ${app.status === 'Approved' ? 'border-green-500' : app.status === 'Rejected' ? 'border-red-500' : 'border-blue-500'}`}>
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900">{app.fullName}</h3>
                  <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-500">
                    <span className="bg-gray-100 px-3 py-1 rounded-lg">📞 {app.mobilePhone}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-lg">🆔 {app.nic}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-lg">📍 {app.district} - {app.city}</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-3 font-bold uppercase">🏠 {app.address}</p>
                </div>
                
                <div className="flex gap-2">
                  {app.status === 'Pending' && (
                    <>
                      <button onClick={() => updateStatus(app, 'Approved')} className="bg-green-600 text-white px-5 py-2 rounded-xl font-black text-xs hover:bg-green-700 uppercase shadow-md transition-all">Approve</button>
                      <button onClick={() => updateStatus(app, 'Rejected')} className="bg-red-600 text-white px-5 py-2 rounded-xl font-black text-xs hover:bg-red-700 uppercase shadow-md transition-all">Reject</button>
                    </>
                  )}
                  <span className={`px-4 py-2 rounded-xl font-black text-xs uppercase ${app.status === 'Approved' ? 'text-green-600 bg-green-50' : app.status === 'Rejected' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>
                    {app.status}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-50">
                <div className="flex flex-wrap gap-2">
                  {app.bestFoods?.map((f: string) => (
                    <span key={f} className="bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1 rounded-full text-[10px] font-black uppercase">{f}</span>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center text-[9px] text-gray-300 font-black uppercase tracking-widest">
                <span>🚚 {app.deliveryMethod}</span>
                <span>📅 Applied: {app.appliedAt?.toDate().toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}