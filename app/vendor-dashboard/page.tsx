'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit } from 'firebase/firestore';

export default function VendorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      const savedPhone = localStorage.getItem('vendorPhone');
      if (!savedPhone) { window.location.href = '/vendor-login'; return; }

      // 1. වෙන්ඩර්ගේ විස්තර සොයා ගැනීම (අපේ DB එකේ තියෙන්නේ mobilePhone නමින්)
      const vQuery = query(collection(db, 'vendors'), where('mobilePhone', '==', savedPhone), limit(1));
      const vSnap = await getDocs(vQuery);
      
      if (!vSnap.empty) {
        const vData = vSnap.docs[0].data();
        setVendor(vData);

        // 2. ඒ වෙන්ඩර්ගේ නගරයට අදාළ ඕඩර් පමණක් ගෙන ඒම
        const q = query(
          collection(db, 'orders'),
          where('city', '==', vData.city.toUpperCase()), // නගරය CAPITAL එකෙන් සර්ච් කිරීම
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        setLoading(false);
      }
    };
    initDashboard();
  }, []);

  if (loading) return <div className="p-20 text-center font-black uppercase italic text-gray-300">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans uppercase">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-600 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-[10px] font-black tracking-[0.3em] text-orange-500">Live Partner Board</h1>
          <h2 className="text-4xl font-black italic tracking-tighter italic">{vendor?.fullName || 'PARTNER'}</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-1">📍 {vendor?.city || 'LOCATION'} ශාඛාව</p>
        </div>
        <button onClick={() => { localStorage.removeItem('vendorPhone'); window.location.href = '/vendor-login'; }} className="bg-zinc-800 px-6 py-2 rounded-full font-black text-[10px] border border-zinc-700 hover:bg-orange-600 transition-all">Logout</button>
      </div>

      {/* Orders Table Style */}
      <div className="max-w-4xl mx-auto space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl border-l-8 border-orange-500 p-8 relative">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-gray-400 block tracking-widest">ID: {order.orderID}</span>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none italic">{order.customerName}</h3>
                <p className="text-orange-600 font-black text-lg">📞 {order.phone}</p>
                <p className="text-gray-500 font-bold text-sm tracking-tight">🏠 {order.address}</p>
                <p className="text-gray-400 font-black text-[9px] mt-4 bg-gray-100 px-4 py-2 rounded-full inline-block tracking-widest">
                  📅 {order.createdAt?.toDate().toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-[10px] font-black block tracking-widest">GRAND TOTAL</span>
                {/* 🛡️ මෙතන තමයි වැදගත්ම තැන. totalPrice නිවැරදිව පෙන්වීම */}
                <span className="text-4xl font-black text-gray-900 italic tracking-tighter font-sans">
                  Rs. {Number(order.totalPrice || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Items List - LARGE FONT */}
            <div className="bg-gray-50 rounded-[2rem] p-6 border-2 border-gray-100 mb-6">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                  <span className="font-black text-gray-800 text-2xl italic tracking-tighter">🥡 {item.qty} X {item.name}</span>
                  <span className="font-bold text-gray-400 italic text-sm">{item.details}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button className="flex-[3] bg-zinc-900 text-white font-black py-5 rounded-[1.5rem] shadow-lg tracking-[0.2em] text-xs hover:bg-orange-600 transition-all">පිළිගන්න (ACCEPT)</button>
              <button className="flex-1 bg-gray-100 text-gray-400 font-black py-5 rounded-[1.5rem] text-[10px] tracking-widest border border-gray-200 uppercase">{order.status}</button>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
            <p className="text-gray-200 font-black text-3xl italic">තවම ඕඩර් කිසිවක් නැත...</p>
          </div>
        )}
      </div>
    </div>
  );
}