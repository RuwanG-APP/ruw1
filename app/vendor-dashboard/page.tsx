'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit, doc, updateDoc } from 'firebase/firestore';

export default function VendorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeBill, setActiveBill] = useState<{order: any, type: 'CHEF' | 'CUSTOMER'} | null>(null);

  const savedPhone = typeof window !== 'undefined' ? localStorage.getItem('vendorPhone') : null;

  useEffect(() => {
    const initDashboard = async () => {
      if (!savedPhone) { window.location.href = '/vendor-login'; return; }

      try {
        const vQuery = query(collection(db, 'vendors'), where('phone', '==', savedPhone.trim()), limit(1));
        const vSnap = await getDocs(vQuery);
        
        if (!vSnap.empty) {
          const vData = vSnap.docs[0].data();
          setVendor(vData);

          const vendorCity = String(vData.city || '').trim().toUpperCase();

          // නගරය අනුව සහ තවමත් කිසිවෙකු භාර නොගත් (Pending) හෝ තමා භාරගත් ඕඩර් පමණක් පෙන්වීම
          const q = query(
            collection(db, 'orders'),
            where('city', '==', vendorCity),
            orderBy('createdAt', 'desc')
          );

          const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
setOrders(list.filter((o: any) => o.status === 'Pending' || o.vendorPhone === savedPhone));
            setLoading(false);
          });
          return () => unsubscribe();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard Error:", err);
        setLoading(false);
      }
    };
    initDashboard();
  }, [savedPhone]);

  const handleAccept = async (orderId: string) => {
    if (!window.confirm("මෙම ඕඩරය භාර ගැනීමට ඔබට අවශ්‍යද?")) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'ACCEPTED',
        vendorPhone: savedPhone
      });
    } catch (err) {
      alert("Error accepting order: " + err);
    }
  };

  if (loading) return <div className="p-20 text-center font-black uppercase italic text-gray-300">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans uppercase">
      {/* Bill Print View (ප්‍රින්ට් කරන වෙලාවට විතරක් පේන කෑල්ල) */}
      {activeBill && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white p-6 w-full max-w-[300px] text-black font-mono text-sm shadow-2xl rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center border-b-2 border-black pb-2 mb-2">
              <h2 className="font-black text-lg">{activeBill.type === 'CHEF' ? 'KITCHEN ORDER' : 'CUSTOMER BILL'}</h2>
              <p className="text-[10px]">{new Date().toLocaleString()}</p>
            </div>
            <p className="font-bold mb-2">ID: {activeBill.order.orderID}</p>
            {activeBill.type === 'CUSTOMER' && (
               <div className="mb-2 border-b border-black pb-2 text-[10px]">
                 <p>NAME: {activeBill.order.customerName}</p>
                 <p>TEL: {activeBill.order.phone}</p>
               </div>
            )}
            <div className="space-y-1 mb-4">
              {activeBill.order.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between border-b border-gray-100 py-1">
                  <span>{item.qty} X {item.name}</span>
                </div>
              ))}
            </div>
            {activeBill.type === 'CUSTOMER' && (
              <div className="text-right border-t-2 border-black pt-2">
                <p className="font-black text-lg">TOTAL: Rs.{Number(activeBill.order.totalAmount).toFixed(2)}</p>
              </div>
            )}
            <div className="mt-6 flex gap-2 no-print">
              <button onClick={() => window.print()} className="flex-1 bg-green-600 text-white py-2 rounded font-bold text-[10px]">PRINT</button>
              <button onClick={() => setActiveBill(null)} className="flex-1 bg-red-600 text-white py-2 rounded font-bold text-[10px]">CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout (ඔයා ආස කරපු මුල් ආකෘතිය) */}
      <div className="max-w-4xl mx-auto bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-600 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-[10px] font-black tracking-[0.3em] text-orange-500">Live Partner Board</h1>
          <h2 className="text-4xl font-black italic tracking-tighter italic">{vendor?.fullName || 'PARTNER'}</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-1">📍 {vendor?.city || 'LOCATION'} ශාඛාව</p>
        </div>
        <button onClick={() => { localStorage.removeItem('vendorPhone'); window.location.href = '/vendor-login'; }} className="bg-zinc-800 px-6 py-2 rounded-full font-black text-[10px] border border-zinc-700 hover:bg-orange-600">Logout</button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {orders.map((order) => (
          <div key={order.id} className={`bg-white rounded-[2.5rem] shadow-xl border-l-8 p-8 transition-all ${order.status === 'ACCEPTED' ? 'border-green-500' : 'border-orange-500'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-gray-400 block tracking-widest uppercase">ID: {order.orderID}</span>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">{order.customerName}</h3>
                <p className="text-orange-600 font-black text-lg font-sans italic">📞 {order.phone}</p>
                <p className="text-gray-500 font-bold text-sm tracking-tight">🏠 {order.address}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-[10px] font-black block">GRAND TOTAL</span>
                <span className="text-4xl font-black text-gray-900 italic tracking-tighter font-sans">
                  Rs. {Number(order.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-[2rem] p-6 border-2 border-gray-100 mb-6">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                  <span className="font-black text-gray-800 text-2xl italic tracking-tighter">🥡 {item.qty} X {item.name}</span>
                  <span className="font-bold text-gray-400 italic text-sm">{item.details}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {order.status === 'Pending' ? (
                <button onClick={() => handleAccept(order.id)} className="flex-1 bg-zinc-900 text-white font-black py-5 rounded-[1.5rem] shadow-lg tracking-widest text-xs hover:bg-green-600">පිළිගන්න (ACCEPT)</button>
              ) : (
                <>
                  <button onClick={() => setActiveBill({order, type: 'CHEF'})} className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-[1.2rem] text-[10px] border border-zinc-700">CHEF BILL</button>
                  <button onClick={() => setActiveBill({order, type: 'CUSTOMER'})} className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-[1.2rem] text-[10px] border border-zinc-700">CUSTOMER BILL</button>
                  <button className="flex-1 bg-green-600 text-white font-black py-4 rounded-[1.2rem] text-[10px]">ACCEPTED ✅</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .fixed, .fixed * { visibility: visible; }
          .fixed { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}