'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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

  const updateStatus = async (id: string, newStatus: string) => {
    if (window.confirm(`මෙම අයදුම්පත ${newStatus} කිරීමට ඔබට අවශ්‍යද?`)) {
      await updateDoc(doc(db, 'vendor_applications', id), { status: newStatus });
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">ඩේටා ලෝඩ් වෙමින් පවතී...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-zinc-900 p-6 rounded-2xl shadow-lg border-b-4 border-orange-500">
          <h1 className="text-2xl font-black text-white uppercase italic">Vendor Applications Manager</h1>
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">{apps.length} Total</span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {apps.map((app) => (
            <div key={app.id} className={`bg-white p-6 rounded-2xl shadow-sm border-l-8 transition-all ${app.status === 'Approved' ? 'border-green-500' : app.status === 'Rejected' ? 'border-red-500' : 'border-blue-500'}`}>
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900">{app.fullName}</h3>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">📞 {app.mobilePhone}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">🆔 {app.nic}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">📍 {app.district} - {app.city}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2 font-medium">🏠 {app.address}</p>
                </div>
                
                <div className="flex gap-2">
                  {app.status === 'Pending' && (
                    <>
                      <button onClick={() => updateStatus(app.id, 'Approved')} className="bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs hover:bg-green-700 uppercase">Approve</button>
                      <button onClick={() => updateStatus(app.id, 'Rejected')} className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-xs hover:bg-red-700 uppercase">Reject</button>
                    </>
                  )}
                  <span className={`px-4 py-2 rounded-xl font-black text-xs uppercase ${app.status === 'Approved' ? 'text-green-600 bg-green-50' : app.status === 'Rejected' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>
                    {app.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Specialties / කෑම වර්ග:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(app.bestFoods) ? app.bestFoods.map((f: string) => (
                    <span key={f} className="bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1 rounded-lg text-xs font-bold">{f}</span>
                  )) : <span className="text-gray-400 text-xs italic">Not specified</span>}
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                <span>Delivery: {app.deliveryMethod}</span>
                <span>Applied: {app.appliedAt?.toDate().toLocaleString()}</span>
              </div>
            </div>
          ))}

          {apps.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold italic">තවමත් කිසිදු අයදුම්පතක් ලැබී නොමැත.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}