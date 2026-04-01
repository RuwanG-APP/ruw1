'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, orderBy } from 'firebase/firestore';

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const vId = localStorage.getItem('vendorId');
    if (!vId) { window.location.href = '/vendor-login'; return; }

    const fetchData = async () => {
      const docRef = doc(db, 'vendors', vId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const vendorData = docSnap.data();
        setVendor(vendorData);

        // නීතිය: නගරය (city) අනුව සර්ච් කර, වෙලාව (createdAt) අනුව Z-A පිළිවෙළට ගනියි
        const q = query(
          collection(db, 'orders'),
          where("city", "==", vendorData.city),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOrders(orderList);
          setLoading(false);
        });

        return () => unsubscribe();
      }
    };

    fetchData();
  }, []);

  const updateStatus = async (id: string, s: string) => {
    await updateDoc(doc(db, 'orders', id), { status: s });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-orange-600 uppercase">Rasa.lk දත්ත පද්ධතිය සූදානම් වේ...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-500 text-white flex justify-between items-end">
          <div>
            <p className="text-orange-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">Live Partner Board</p>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{vendor?.fullName}</h1>
            <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">📍 {vendor?.city} කලාපය</p>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = '/vendor-login'; }} className="bg-white/10 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase border border-white/20">Logout</button>
        </div>

        {/* Orders */}
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[15px] border-orange-500 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">{order.customerName}</h3>
                  <p className="text-sm font-bold text-orange-600">📞 {order.phone}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase leading-tight">🏠 {order.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase">මුළු මුදල</p>
                  <p className="text-2xl font-black text-gray-950 leading-none tracking-tighter">Rs. {order.totalPrice}.00</p>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-gray-50 p-4 rounded-2xl mb-5 space-y-1 border border-gray-100">
                 {order.items?.map((item: any, idx: number) => (
                   <div key={idx} className="flex justify-between text-[13px] font-bold text-gray-700">
                      <span>🍴 {item.name} x {item.qty}</span>
                      <span className="text-gray-400 italic text-[10px] uppercase">{item.details}</span>
                   </div>
                 ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {order.status === 'Pending' && (
                  <button onClick={() => updateStatus(order.id, 'Preparing')} className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-orange-600 transition-all">පිළිගන්න (Accept)</button>
                )}
                {order.status === 'Preparing' && (
                  <button onClick={() => updateStatus(order.id, 'Ready')} className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]">සූදානම් (Ready)</button>
                )}
                <div className="bg-gray-100 px-6 py-4 rounded-2xl text-[10px] font-black text-gray-500 uppercase flex items-center border border-gray-200">{order.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}