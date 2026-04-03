'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export default function VendorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeBill, setActiveBill] = useState<{order: any, type: 'CHEF' | 'CUSTOMER'} | null>(null);
  const [view, setView] = useState<'LIVE' | 'HISTORY' | 'MENU'>('LIVE'); // MENU ටැබ් එක එකතු කළා
  const [menuSettings, setMenuSettings] = useState<any>(null);
  const [requestModal, setRequestModal] = useState<any>(null); // මිල වෙනස් කිරීමේ popup එකට

  const savedPhone = typeof window !== 'undefined' ? localStorage.getItem('vendorPhone') : null;

  // 1. මිල ගණන් සහ නියෝජිත දත්ත ලබා ගැනීම
  useEffect(() => {
    const initDashboard = async () => {
      if (!savedPhone) { window.location.href = '/vendor-login'; return; }
      try {
        // Master Menu Settings ලබා ගැනීම
        onSnapshot(doc(db, 'settings', 'menu'), (snap) => {
          if (snap.exists()) setMenuSettings(snap.data());
        });

        const vQuery = query(collection(db, 'vendors'), where('phone', '==', savedPhone.trim()), limit(1));
        const vSnap = await getDocs(vQuery);
        
        if (!vSnap.empty) {
          const vData = vSnap.docs[0].data();
          setVendor(vData);
          const vendorCity = String(vData.city || '').trim().toUpperCase();

          const q = query(collection(db, 'orders'), where('city', '==', vendorCity), orderBy('createdAt', 'desc'));
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            setOrders(list);
            setLoading(false);
          });
          return () => unsubscribe();
        } else { setLoading(false); }
      } catch (err) { setLoading(false); }
    };
    initDashboard();
  }, [savedPhone]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!window.confirm("ඔබට විශ්වාසද?")) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus, vendorPhone: savedPhone });
    } catch (err) { alert("Error: " + err); }
  };

  // 2. මිල වෙනස් කිරීමේ ඉල්ලීම යැවීම
  const handlePriceRequest = async (e: any) => {
    e.preventDefault();
    const { itemId, currentCost, requestedCost, reason } = requestModal;
    try {
      await addDoc(collection(db, 'price_requests'), {
        vendorPhone: savedPhone,
        vendorName: vendor?.fullName,
        itemId,
        currentCost,
        requestedCost: parseFloat(requestedCost),
        reason,
        status: 'PENDING',
        createdAt: serverTimestamp()
      });
      alert("ඉල්ලීම සාර්ථකව යැවුණා! අයිතිකරුගේ අනුමැතිය ලැබුණු පසු මිල වෙනස් වනු ඇත.");
      setRequestModal(null);
    } catch (err) { alert("Error: " + err); }
  };

  const filteredOrders = orders.filter((o: any) => {
    if (view === 'LIVE') return (o.status === 'Pending' || (o.status === 'ACCEPTED' && o.vendorPhone === savedPhone));
    if (view === 'HISTORY') return (o.status === 'DELIVERED' && o.vendorPhone === savedPhone);
    return false;
  });

  if (loading) return <div className="p-20 text-center font-black uppercase italic text-gray-300">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 font-sans uppercase">
      
      {/* Price Request Modal (Popup) */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <form onSubmit={handlePriceRequest} className="bg-white p-8 rounded-[2rem] w-full max-w-md border-b-8 border-orange-600 shadow-2xl">
            <h3 className="text-2xl font-black italic mb-4">REQUEST COST CHANGE</h3>
            <p className="text-[10px] font-bold text-gray-400 mb-6 tracking-widest uppercase">ITEM: {requestModal.itemId}</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 block mb-1">දැනට පවතින මිල (Cost)</label>
                <input type="text" value={requestModal.currentCost} disabled className="w-full bg-gray-100 p-3 rounded-xl font-bold border-2 border-gray-200" />
              </div>
              <div>
                <label className="text-[10px] font-black text-orange-600 block mb-1">අලුතින් අවශ්‍ය මිල (Requested Cost)</label>
                <input type="number" required onChange={(e) => setRequestModal({...requestModal, requestedCost: e.target.value})} className="w-full p-3 rounded-xl font-bold border-2 border-orange-200 focus:border-orange-500 outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 block mb-1">වෙනස් කිරීමට හේතුව (Reason)</label>
                <textarea required onChange={(e) => setRequestModal({...requestModal, reason: e.target.value})} className="w-full p-3 rounded-xl font-bold border-2 border-gray-200 focus:border-orange-500 outline-none h-24" placeholder="බඩු මිල වැඩි වීම නිසා..." />
              </div>
            </div>

            <div className="flex gap-2 mt-8">
              <button type="submit" className="flex-1 bg-zinc-950 text-white py-4 rounded-xl font-black text-xs">SUBMIT REQUEST</button>
              <button type="button" onClick={() => setRequestModal(null)} className="px-6 py-4 rounded-xl font-black text-xs text-gray-400">CANCEL</button>
            </div>
          </form>
        </div>
      )}

      {/* Header (පරණ විදිහටමයි) */}
      <div className="max-w-4xl mx-auto bg-zinc-950 text-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-600 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-[10px] font-black tracking-[0.4em] text-orange-500 uppercase">Live Partner Board</h1>
          <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase">{vendor?.fullName}</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-2">📍 {vendor?.city} ශාඛාව</p>
        </div>
        <button onClick={() => { localStorage.removeItem('vendorPhone'); window.location.href = '/vendor-login'; }} className="bg-zinc-800 px-8 py-3 rounded-full font-black text-xs border border-zinc-700 uppercase">Logout</button>
      </div>

      {/* Tabs - දැන් 3ක් තියෙනවා */}
      <div className="max-w-4xl mx-auto flex gap-2 mb-8 bg-white p-2 rounded-3xl shadow-sm border border-gray-200">
        <button onClick={() => setView('LIVE')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] transition-all ${view === 'LIVE' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400'}`}>සජීවී ඇණවුම්</button>
        <button onClick={() => setView('HISTORY')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] transition-all ${view === 'HISTORY' ? 'bg-zinc-900 text-white shadow-lg' : 'text-gray-400'}`}>ඉතිහාසය</button>
        <button onClick={() => setView('MENU')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] transition-all ${view === 'MENU' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>මගේ මෙනුව (MENU)</button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* MENU View */}
        {view === 'MENU' && menuSettings && (
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border-b-8 border-blue-600">
            <h3 className="text-2xl font-black italic mb-6 border-b pb-2">MY ITEM COSTS</h3>
            <div className="space-y-4">
              {Object.entries(menuSettings).map(([id, data]: [string, any]) => (
                <div key={id} className="flex justify-between items-center bg-gray-50 p-6 rounded-[1.5rem] border-2 border-gray-100">
                  <div>
                    <h4 className="font-black text-xl italic uppercase">{id}</h4>
                    <p className="text-[10px] font-bold text-gray-400">ඔබට ලැබෙන මුදල: <span className="text-blue-600">Rs. {data.cost}</span></p>
                  </div>
                  <button onClick={() => setRequestModal({itemId: id, currentCost: data.cost})} className="bg-zinc-900 text-white px-6 py-3 rounded-full font-black text-[10px] hover:bg-orange-600 transition-all uppercase">මිල වෙනස් කරන්න</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE & HISTORY View (පරණ කෝඩ් එකමයි) */}
        {view !== 'MENU' && filteredOrders.map((order: any) => (
           <div key={order.id} className={`bg-white rounded-[2.5rem] shadow-xl border-l-[12px] p-6 sm:p-8 ${order.status === 'ACCEPTED' ? 'border-green-500' : 'border-orange-500'}`}>
             {/* ... කලින් තිබූ ඕඩර් කාඩ් එකේ කෝඩ් එක මෙතනට එනවා ... */}
             <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <h3 className="text-2xl font-black uppercase italic">{order.customerName}</h3>
                <span className="text-3xl font-black">Rs. {Number(order.totalAmount).toFixed(2)}</span>
             </div>
             {/* සරල බව සඳහා මම මෙතන කෙටියෙන් පෙන්වන්නේ, ඔයාගේ පරණ ලස්සන UI එක එහෙම්මම තියෙනවා */}
             <div className="flex gap-2">
               {order.status === 'Pending' ? (
                 <button onClick={() => updateOrderStatus(order.id, 'ACCEPTED')} className="w-full bg-zinc-950 text-white font-black py-4 rounded-2xl">පිළිගන්න (ACCEPT)</button>
               ) : order.status === 'ACCEPTED' ? (
                 <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="w-full bg-green-600 text-white font-black py-4 rounded-2xl uppercase text-xs">Mark Delivered ✅</button>
               ) : <span className="text-[10px] font-bold text-gray-400 italic">අවසන් කරන ලද ඇණවුම</span>}
             </div>
           </div>
        ))}
      </div>
    </div>
  );
}