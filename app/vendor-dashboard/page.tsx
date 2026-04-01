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

        // නගරය අනුව ඕඩර්ස් පෙළගැස්වීම
        const q = query(
          collection(db, 'orders'),
          where("city", "==", vendorData.city),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOrders(orderList);
          setLoading(false);
        }, (error) => {
          console.error("Query Error:", error);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-orange-600 animate-pulse">Rasa.lk දත්ත පරීක්ෂා කරමින්...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-500 text-white relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-orange-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">Partner Portal</p>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">ආයුබෝවන්, {vendor?.fullName}!</h1>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.href = '/vendor-login'; }} className="bg-white/10 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase border border-white/20 transition-all hover:bg-red-500">Logout</button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-gray-950 uppercase italic ml-2 tracking-tighter">නවතම ඇණවුම් ({vendor?.city})</h2>
          
          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-gray-200">
               <p className="font-bold text-gray-400 uppercase text-xs tracking-widest">තවමත් ඇණවුම් කිසිවක් ලැබී නොමැත.</p>
            </div>
          ) : orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[12px] border-orange-500">
              <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</p>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">{order.customerName}</h3>
                  {/* Phone සහ Address මෙතන පෙන්වනවා */}
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-orange-600">📞 {order.phone || order.customerPhone || 'දුරකථනය ඇතුළත් කර නැත'}</p>
                    <p className="text-[11px] font-bold text-gray-500 leading-tight uppercase">🏠 {order.address || 'ලිපිනය ඇතුළත් කර නැත'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                  <p className="text-2xl font-black text-gray-950 leading-none">Rs. {order.price || order.totalPrice || '0'}.00</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl mb-5 border border-gray-100">
                 {order.items?.map((item: any, idx: number) => (
                   <div key={idx} className="flex justify-between text-sm font-bold text-gray-700 py-1 border-b border-gray-100 last:border-0">
                      <span>🍴 {item.name} x {item.qty}</span>
                      <span className="text-gray-400 italic text-[10px] uppercase">{item.details || item.portion || ''}</span>
                   </div>
                 ))}
              </div>

              <div className="flex gap-2">
                {order.status === 'Pending' || order.status === 'PAID (PENDING GATEWAY)' ? (
                  <button onClick={() => updateOrderStatus(order.id, 'Preparing')} className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg">පිළිගන්න (Accept)</button>
                ) : null}
                
                {order.status === 'Preparing' && (
                  <button onClick={() => updateOrderStatus(order.id, 'Ready')} className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">සූදානම් (Ready)</button>
                )}

                <div className="bg-gray-100 px-6 py-4 rounded-2xl text-[10px] font-black text-gray-500 uppercase flex items-center border border-gray-200">
                  {order.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}