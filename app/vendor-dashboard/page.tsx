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

    const fetchVendorAndOrders = async () => {
      const docRef = doc(db, 'vendors', vId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const vendorData = docSnap.data();
        setVendor(vendorData);

        // රියල් ටයිම් ඕඩර්ස් ලබා ගැනීම (නගරය අනුව ෆිල්ටර් කර ඇත)
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
      } else {
        localStorage.removeItem('vendorId');
        window.location.href = '/vendor-login';
      }
    };

    fetchVendorAndOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      alert("Error updating order: " + error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-orange-600 animate-pulse uppercase tracking-widest">Rasa.lk දත්ත පරීක්ෂා කරමින්...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-500 text-white relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-orange-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">Rasa.lk Partner</p>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">ආයුබෝවන්, {vendor?.fullName}!</h1>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.href = '/vendor-login'; }} className="bg-white/10 hover:bg-red-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all border border-white/20">Logout</button>
          </div>
          <div className="absolute top-0 right-0 text-white/5 text-9xl font-black -mr-10 -mt-10 italic">RASA</div>
        </div>

        {/* Status Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
            <p className="text-gray-400 font-bold text-[10px] uppercase mb-1">දැනට ලැබී ඇති ඇණවුම්</p>
            <p className="text-2xl font-black text-gray-900">{orders.filter(o => o.status !== 'Completed').length}</p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 text-right">
            <p className="text-gray-400 font-bold text-[10px] uppercase mb-1">නගරය</p>
            <p className="text-xl font-black text-orange-600 italic leading-none uppercase">{vendor?.city}</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-gray-950 uppercase italic tracking-tighter ml-2">නවතම ඇණවුම්</h2>
          
          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] text-center space-y-3 border-2 border-dashed border-gray-200">
              <div className="text-4xl">😴</div>
              <p className="font-bold text-gray-400 uppercase text-xs">තවමත් ඇණවුම් කිසිවක් ලැබී නොමැත.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[12px] transition-all ${order.status === 'Completed' ? 'border-gray-200 opacity-60' : 'border-orange-500'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">{order.customerName}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-1">📞 {order.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                    <p className="text-xl font-black text-gray-950 leading-none">Rs. {order.totalPrice}.00</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl mb-5 space-y-2">
                   {order.items?.map((item: any, idx: number) => (
                     <div key={idx} className="flex justify-between text-sm font-bold text-gray-700">
                        <span>{item.name.si || item.name} x {item.qty}</span>
                        <span className="text-gray-400 italic">({item.portion})</span>
                     </div>
                   ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.status === 'Pending' && (
                    <button onClick={() => updateOrderStatus(order.id, 'Preparing')} className="flex-1 bg-zinc-900 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all">පිළිගන්න (Accept)</button>
                  )}
                  {order.status === 'Preparing' && (
                    <button onClick={() => updateOrderStatus(order.id, 'Ready')} className="flex-1 bg-orange-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg">සූදානම් (Ready)</button>
                  )}
                  {order.status === 'Ready' && (
                    <button onClick={() => updateOrderStatus(order.id, 'Completed')} className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all">අවසන් (Complete)</button>
                  )}
                  <span className="bg-gray-100 px-5 py-3 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center border border-gray-200">
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}