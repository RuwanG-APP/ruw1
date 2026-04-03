'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit, doc, updateDoc } from 'firebase/firestore';

export default function VendorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeBill, setActiveBill] = useState<{order: any, type: 'CHEF' | 'CUSTOMER'} | null>(null);
  const [view, setView] = useState<'LIVE' | 'HISTORY'>('LIVE');

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

          const q = query(
            collection(db, 'orders'),
            where('city', '==', vendorCity),
            orderBy('createdAt', 'desc')
          );

          const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            setOrders(list);
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

  // Status අප්ඩේට් කරන ෆන්ක්ෂන් එක
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const msg = newStatus === 'ACCEPTED' ? "මෙම ඕඩරය භාර ගැනීමට අවශ්‍යද?" : "මෙම ඕඩරය අවසන් (DELIVERED) ලෙස සලකුණු කිරීමට අවශ්‍යද?";
    if (!window.confirm(msg)) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        vendorPhone: savedPhone
      });
    } catch (err) {
      alert("Error: " + err);
    }
  };

  // Tabs අනුව ෆිල්ටර් කිරීම
  const filteredOrders = orders.filter((o: any) => {
    if (view === 'LIVE') return (o.status === 'Pending' || (o.status === 'ACCEPTED' && o.vendorPhone === savedPhone));
    return (o.status === 'DELIVERED' && o.vendorPhone === savedPhone);
  });

  if (loading) return <div className="p-20 text-center font-black uppercase italic text-gray-300 animate-pulse">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 font-sans uppercase">
      
      {/* Bill Print View */}
      {activeBill && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white p-6 w-full max-w-[320px] text-black font-mono text-xs shadow-2xl rounded-xl">
            <div className="text-center border-b-2 border-black pb-3 mb-3">
              <h2 className="font-black text-xl">{activeBill.type === 'CHEF' ? '👨‍🍳 KITCHEN' : '🧾 CUSTOMER'}</h2>
              <p className="text-[10px] mt-1">{new Date().toLocaleString()}</p>
            </div>
            <p className="font-black mb-2 bg-black text-white px-2 py-1 inline-block">ID: {activeBill.order.orderID}</p>
            {activeBill.type === 'CUSTOMER' && (
               <div className="mb-3 border-b border-gray-300 pb-2 italic">
                 <p>NAME: {activeBill.order.customerName}</p>
                 <p>TEL: {activeBill.order.phone}</p>
                 <p className="text-[9px]">ADDR: {activeBill.order.address}</p>
               </div>
            )}
            <div className="space-y-2 mb-4">
              {activeBill.order.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="font-bold">{item.qty} X {item.name}</span>
                </div>
              ))}
            </div>
            {activeBill.type === 'CUSTOMER' && (
              <div className="text-right border-t-2 border-black pt-2">
                <p className="font-black text-lg">TOTAL: RS.{Number(activeBill.order.totalAmount).toFixed(2)}</p>
              </div>
            )}
            <div className="mt-8 flex gap-2 no-print">
              <button onClick={() => window.print()} className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-black">PRINT</button>
              <button onClick={() => setActiveBill(null)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black">CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="max-w-4xl mx-auto bg-zinc-950 text-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-600 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-[10px] font-black tracking-[0.4em] text-orange-500 uppercase">Live Partner Board</h1>
          <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase">{vendor?.fullName || 'PARTNER'}</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-2">📍 {vendor?.city || 'LOCATION'} ශාඛාව</p>
        </div>
        <button onClick={() => { localStorage.removeItem('vendorPhone'); window.location.href = '/vendor-login'; }} className="bg-zinc-800 px-8 py-3 rounded-full font-black text-xs border border-zinc-700 hover:bg-red-600 transition-all uppercase">Logout</button>
      </div>

      {/* View Selector Tabs */}
      <div className="max-w-4xl mx-auto flex gap-2 mb-8 bg-white p-2 rounded-3xl shadow-sm border border-gray-200">
        <button onClick={() => setView('LIVE')} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${view === 'LIVE' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400'}`}>සජීවී ඇණවුම් (LIVE)</button>
        <button onClick={() => setView('HISTORY')} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${view === 'HISTORY' ? 'bg-zinc-900 text-white shadow-lg' : 'text-gray-400'}`}>ඉතිහාසය (HISTORY)</button>
      </div>

      {/* Orders List */}
      <div className="max-w-4xl mx-auto space-y-6">
        {filteredOrders.map((order: any) => (
          <div key={order.id} className={`bg-white rounded-[2.5rem] shadow-xl border-l-[12px] p-6 sm:p-8 transition-all ${order.status === 'ACCEPTED' ? 'border-green-500' : order.status === 'DELIVERED' ? 'border-zinc-300' : 'border-orange-500'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-300 block tracking-widest uppercase">ID: {order.orderID}</span>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">{order.customerName}</h3>
                <p className="text-orange-600 font-black text-xl font-sans italic">📞 {order.phone}</p>
                <p className="text-gray-500 font-bold text-sm leading-tight">🏠 {order.address}</p>
              </div>
              <div className="sm:text-right w-full sm:w-auto bg-gray-50 p-4 rounded-2xl sm:bg-transparent sm:p-0">
                <span className="text-gray-400 text-[10px] font-black block tracking-widest">GRAND TOTAL</span>
                <span className="text-4xl font-black text-gray-900 italic tracking-tighter font-sans">
                  Rs. {Number(order.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Items Card */}
            <div className="bg-zinc-50 rounded-[2rem] p-5 border-2 border-gray-100 mb-6">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                  <span className="font-black text-gray-800 text-xl italic tracking-tighter">🥡 {item.qty} X {item.name}</span>
                  <span className="font-bold text-gray-400 italic text-xs">{item.details}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {order.status === 'Pending' && (
                <button onClick={() => updateOrderStatus(order.id, 'ACCEPTED')} className="w-full bg-zinc-950 text-white font-black py-5 rounded-[1.5rem] shadow-xl tracking-widest text-xs hover:bg-green-600 transition-all uppercase">පිළිගන්න (ACCEPT ORDER)</button>
              )}
              {order.status === 'ACCEPTED' && (
                <>
                  <button onClick={() => setActiveBill({order, type: 'CHEF'})} className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-[1.2rem] text-[10px] border border-zinc-700 hover:bg-orange-600">CHEF BILL</button>
                  <button onClick={() => setActiveBill({order, type: 'CUSTOMER'})} className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-[1.2rem] text-[10px] border border-zinc-700 hover:bg-orange-600">CUSTOMER BILL</button>
                  <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="w-full sm:w-auto flex-[2] bg-green-600 text-white font-black py-4 rounded-[1.2rem] text-[10px] shadow-lg hover:bg-green-700 uppercase">DELIVERED ✅</button>
                </>
              )}
              {order.status === 'DELIVERED' && (
                <div className="w-full flex justify-between items-center bg-gray-100 p-4 rounded-2xl">
                   <span className="text-[10px] font-black text-gray-400">අවසන් කරන ලද ඇණවුම</span>
                   <button onClick={() => setActiveBill({order, type: 'CUSTOMER'})} className="text-[10px] font-black text-orange-600 underline">බිල බලන්න</button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
            <p className="text-gray-200 font-black text-2xl italic tracking-tighter">මෙම අංශයේ ඇණවුම් කිසිවක් නැත...</p>
          </div>
        )}
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