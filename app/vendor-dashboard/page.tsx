'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export default function VendorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // මාලාගේ නගරය (Kegalle) අනුව ඕඩර් පෙරා ගැනීම
    const q = query(
      collection(db, 'orders'),
      where('city', '==', 'Kegalle'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(list);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      {/* Header */}
      <div className="max-w-4xl mx-auto bg-zinc-900 text-white p-6 rounded-[2.5rem] shadow-xl border-b-8 border-orange-600 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Live Partner Board</h1>
          <h2 className="text-4xl font-black italic tracking-tighter">MALA</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">📍 KEGALLE ශාඛාව</p>
        </div>
        <button className="bg-zinc-800 px-6 py-2 rounded-full font-black text-[10px] uppercase border border-zinc-700">Logout</button>
      </div>

      {/* Orders List */}
      <div className="max-w-4xl mx-auto space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-[2.5rem] shadow-lg border-l-8 border-orange-500 overflow-hidden relative">
            <div className="p-6 sm:p-8">
              
              {/* Customer Info & Price */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{order.customerName}</h3>
                  <p className="text-orange-600 font-black text-lg mt-1 flex items-center gap-2">📞 {order.phone}</p>
                  
                  {/* FULL ADDRESS - ඔයා ඉල්ලපු විදිහට ඇඩ්‍රස් එක මෙතන පේනවා */}
                  <p className="text-gray-500 font-bold text-sm uppercase mt-1 tracking-tight">🏠 {order.address}</p>
                  
                  {/* DATE & TIME - ඕඩර් එක ආපු වෙලාව */}
                  <p className="text-gray-400 font-bold text-[10px] mt-2 bg-gray-100 px-3 py-1 rounded-full inline-block">
                    📅 {order.createdAt?.toDate().toLocaleString('en-US', { hour12: true })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-[10px] font-black uppercase block">මුළු මුදල</span>
                  <span className="text-3xl font-black text-gray-900 italic tracking-tighter">Rs. {order.totalPrice}.00</span>
                </div>
              </div>

              {/* Items Box - FONT SIZE එක වැඩි කර ඇත */}
              <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100 mb-4">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-1">
                    {/* Font size එක text-xl කර ලොකු කරන ලදී */}
                    <span className="font-black text-gray-800 text-xl tracking-tight italic">🥡 {item.name} x {item.qty}</span>
                    <span className="font-bold text-gray-400 italic text-sm">{item.details}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-[3] bg-zinc-900 text-white font-black py-4 rounded-2xl shadow-md uppercase tracking-widest text-xs hover:bg-orange-600 transition-all">පිළිගන්න (ACCEPT)</button>
                <button className="flex-1 bg-gray-100 text-gray-400 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest border border-gray-200">{order.status}</button>
              </div>

            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-gray-200">
            <p className="text-gray-300 font-black text-2xl uppercase italic">තවම ඕඩර් කිසිවක් නැත...</p>
          </div>
        )}
      </div>
    </div>
  );
}