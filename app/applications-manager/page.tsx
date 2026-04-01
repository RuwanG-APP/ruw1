'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ApplicationsManager() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const lang = 'si'; // උඩින්ම දාමු එතකොට ප්‍රශ්න නෑ

  useEffect(() => {
    try {
      const q = query(collection(db, 'vendor_applications'), orderBy('appliedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApps(list);
        setLoading(false);
      }, (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Setup Error:", err);
      setLoading(false);
    }
  }, []);

  const updateStatus = async (app: any, newStatus: string) => {
    const msg = `මෙම අයදුම්පත ${newStatus} කිරීමට ඔබට අවශ්‍යද?`;
    if (window.confirm(msg)) {
      try {
        await updateDoc(doc(db, 'vendor_applications', app.id), { status: newStatus });

        if (newStatus === 'Approved') {
          const password = app.nic ? app.nic.slice(-4) : "1234"; 
          await addDoc(collection(db, 'vendors'), {
            fullName: app.fullName || "No Name",
            mobilePhone: app.mobilePhone || "0000000000",
            nic: app.nic || "N/A",
            district: app.district || "N/A",
            city: app.city || "N/A",
            bestFoods: app.bestFoods || [],
            password: password,
            isPaid: false,
            approvedAt: serverTimestamp(),
            trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          });
          alert(`සාර්ථකයි! නියෝජිතයා ඇතුළත් කරන ලදී. මුද්‍රිත පදය (Password): ${password}`);
        }
      } catch (error) {
        alert("Error updating status: " + error);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center font-black animate-bounce text-orange-600">ඩේටා ලෝඩ් වෙමින් පවතී...</div>
    </div>
  );

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
                  <h3 className="text-xl font-black text-gray-900">{app.fullName || 'Unknown'}</h3>
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
                  {Array.isArray(app.bestFoods) ? app.bestFoods.map((f: string) => (
                    <span key={f} className="bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1 rounded-full text-[10px] font-black uppercase">{f}</span>
                  )) : <span className="text-gray-300 text-[10px] italic">No Foods Listed</span>}
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center text-[9px] text-gray-300 font-black uppercase tracking-widest">
                <span>🚚 {app.deliveryMethod}</span>
                <span>📅 Applied: {app.appliedAt ? (app.appliedAt.toDate ? app.appliedAt.toDate().toLocaleString() : 'Date Error') : 'No Date'}</span>
              </div>
            </div>
          ))}

          {apps.length === 0 && (
            <div className="bg-white p-20 rounded-3xl text-center font-bold text-gray-400 italic border-2 border-dashed border-gray-200">
               තවමත් කිසිදු අයදුම්පතක් ලැබී නොමැත.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}