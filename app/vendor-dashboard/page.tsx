'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit } from 'firebase/firestore';

export default function VendorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      const savedPhone = localStorage.getItem('vendorPhone');
      if (!savedPhone) { window.location.href = '/vendor-login'; return; }

      // 1. ලොග් වුණු වෙන්ඩර්ගේ විස්තර සොයා ගැනීම (Dynamic)
      const vQuery = query(collection(db, 'vendors'), where('phone', '==', savedPhone), limit(1));
      const vSnap = await getDocs(vQuery);
      
      if (!vSnap.empty) {
        const vData = vSnap.docs[0].data();
        setVendor(vData);

        // 2. ඒ වෙන්ඩර්ගේ නගරයට (City) අදාළ ඕඩර් පමණක් ගෙන ඒම
        const q = query(
          collection(db, 'orders'),
          where('city', '==', vData.city),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        window.location.href = '/vendor-login';
      }
    };
    initApp();
  }, []);

  if (loading) return <div className="p-20 text-center font-black italic uppercase text-gray-300">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      {/* Header - Dynamic Name & City */}
      <div className="max-w-4xl mx-auto bg-zinc-900 text-white p-8 rounded-[3rem] shadow-2xl border-b-8 border-orange-600 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Live Partner Board</h1>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">{vendor?.name || 'PARTNER'}</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">📍 {vendor?.city || 'Location'} Branch</p>
        </div>
        <button onClick={() => { localStorage.removeItem('vendorPhone'); window.location.href = '/vendor-login'; }} className="bg-zinc-800 px-6 py-2 rounded-full font-black text-[10px] uppercase border border-zinc-700 hover:bg-orange-600 transition-all">Logout</button>
      </div>

      {/* Orders List - Original Layout with Address and Date */}
      <div className="max-w-4xl mx-auto space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl border-l-8 border-orange-500 p-8 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase">{order.customerName}</h3>
                <p className="text-orange-600 font-black text-xl mt-2 flex items-center gap-2">📞 {order.phone}</p>
                <p className="text-gray-500 font-bold text-sm uppercase mt-1 tracking-tight">🏠 {order.address}</p>
                <p className="text-gray-400 font-black text-[10px] mt-4 bg-gray-100 px-4 py-2 rounded-full inline-block uppercase tracking-widest">📅 {order.createdAt?.toDate().toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-[10px] font-black uppercase block tracking-widest">Total Bill</span>
                <span className="text-4xl font-black text-gray-900 italic tracking-tighter">Rs. {order.totalPrice}.00</span>
              </div>
            </div>

            {/* Large Font Items List */}
            <div className="bg-gray-50 rounded-[2rem] p-6 border-2 border-gray-100 mb-6">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                  <span className="font-black text-gray-800 text-2xl italic tracking-tighter uppercase">🥡 {item.name} x {item.qty}</span>
                  <span className="font-bold text-gray-400 italic text-sm">{item.details}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button className="flex-[3] bg-zinc-900 text-white font-black py-5 rounded-[1.5rem] shadow-lg uppercase tracking-[0.2em] text-xs hover:bg-orange-600 transition-all">Accept Order</button>
              <button className="flex-1 bg-gray-100 text-gray-400 font-black py-5 rounded-[1.5rem] uppercase text-[10px] tracking-widest border border-gray-200">{order.status}</button>
            </div>
          </div>
        ))}
        {orders.length === 0 && <div className="text-center py-20 font-black text-gray-300 uppercase italic text-xl">No orders for your city yet.</div>}
      </div>
    </div>
  );
}