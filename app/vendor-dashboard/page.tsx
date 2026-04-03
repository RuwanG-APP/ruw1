'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export default function VendorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeBill, setActiveBill] = useState<{order: any, type: 'CHEF' | 'CUSTOMER'} | null>(null);
  const [view, setView] = useState<'LIVE' | 'HISTORY' | 'MENU'>('LIVE');
  const [menuSettings, setMenuSettings] = useState<any>(null);
  const [requestModal, setRequestModal] = useState<any>(null);

  const savedPhone = typeof window !== 'undefined' ? localStorage.getItem('vendorPhone') : null;

  useEffect(() => {
    const initDashboard = async () => {
      if (!savedPhone) { window.location.href = '/vendor-login'; return; }
      try {
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

  // මූල්‍යමය ගණනය කිරීම් (Admin Settings මත පදනම්ව)
  const calculateFinancials = (order: any) => {
    let totalVendorCost = 0;
    const sellingPrice = Number(order.totalAmount || 0);

    order.items?.forEach((item: any) => {
      // අයිටම් එකේ නම අනුව Admin Settings වලින් Cost එක සෙවීම
      const itemKey = item.id || item.name.toLowerCase().replace(" ", "-");
      const setting = menuSettings?.[itemKey];
      
      if (setting && setting.cost) {
        totalVendorCost += (Number(setting.cost) * item.qty);
      } else {
        // ඇඩ්මින් සෙටිංස් වල මිලක් නැතිනම් දළ වශයෙන් 80% ක් පිරිවැය ලෙස සලකමු
        totalVendorCost += (item.price * 0.8);
      }
    });

    // පරාටා හොදි ලොජික් එක වැනි අමතර දේවල් තිබේ නම් ඒවාත් මෙතනට එකතු වේ
    const profit = sellingPrice - totalVendorCost;
    return { sellingPrice, vendorCost: totalVendorCost, profit };
  };

  const filteredOrders = orders.filter((o: any) => {
    if (view === 'LIVE') return (o.status === 'Pending' || (o.status === 'ACCEPTED' && o.vendorPhone === savedPhone));
    if (view === 'HISTORY') return (o.status === 'DELIVERED' && o.vendorPhone === savedPhone);
    return false;
  });

  if (loading) return <div className="p-20 text-center font-black italic text-gray-300">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 font-sans uppercase">
      
      {/* Header (පරණ විදිහටමයි) */}
      <div className="max-w-6xl mx-auto bg-zinc-950 text-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-600 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-[10px] font-black tracking-[0.4em] text-orange-500 mb-1 uppercase">Live Partner Board</h1>
          <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase">{vendor?.fullName}</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-2 tracking-widest uppercase">📍 {vendor?.city} BRANCH</p>
        </div>
        <button onClick={() => { localStorage.removeItem('vendorPhone'); window.location.href = '/vendor-login'; }} className="bg-zinc-800 px-8 py-3 rounded-full font-black text-[10px] border border-zinc-700 hover:bg-red-600 transition-all uppercase">Logout</button>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto flex gap-2 mb-8 bg-white p-2 rounded-[2rem] shadow-sm border border-gray-200">
        <button onClick={() => setView('LIVE')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] tracking-widest transition-all ${view === 'LIVE' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 uppercase'}`}>සජීවී ඇණවුම්</button>
        <button onClick={() => setView('HISTORY')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] tracking-widest transition-all ${view === 'HISTORY' ? 'bg-zinc-900 text-white shadow-lg' : 'text-gray-400 uppercase'}`}>ඉතිහාසය (HISTORY)</button>
        <button onClick={() => setView('MENU')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] tracking-widest transition-all ${view === 'MENU' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 uppercase'}`}>මගේ මෙනුව</button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HISTORY View - දැන් සියල්ල ටේබල් එකේ පමණි */}
        {view === 'HISTORY' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border-2 border-black">
            <div className="bg-black text-white p-6 flex justify-between items-center">
              <h3 className="text-xl font-black italic tracking-tighter uppercase">Financial Settlement Log</h3>
              <span className="text-[10px] font-black bg-orange-600 px-4 py-1 rounded-full uppercase italic">Transparency Mode</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b-2 border-black font-black text-[10px] tracking-widest text-zinc-500 uppercase">
                    <th className="p-4 text-left">Customer / Items</th>
                    <th className="p-4 text-center">Order No</th>
                    <th className="p-4 text-center">Date</th>
                    <th className="p-4 text-right">Selling Price</th>
                    <th className="p-4 text-right bg-blue-50 text-blue-900 italic font-black">Cost (Payout)</th>
                    <th className="p-4 text-right bg-orange-50 text-orange-700 italic font-black">Profit</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="font-sans font-bold text-xs uppercase tracking-tight">
                  {filteredOrders.map((order: any) => {
                    const { sellingPrice, vendorCost, profit } = calculateFinancials(order);
                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <p className="font-black text-gray-900 italic text-sm">{order.customerName}</p>
                          <div className="text-[9px] text-orange-600 mt-1 space-y-0.5">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i}>🥡 {item.qty} X {item.name}</div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-center text-[10px] font-black text-gray-400">{order.orderID}</td>
                        <td className="p-4 text-center text-[10px] font-black text-gray-500">{order.orderDateOnly || 'PENDING'}</td>
                        <td className="p-4 text-right font-black">Rs. {sellingPrice.toFixed(2)}</td>
                        <td className="p-4 text-right font-black bg-blue-50/50 text-blue-600 italic">Rs. {vendorCost.toFixed(2)}</td>
                        <td className="p-4 text-right font-black bg-orange-50/50 text-orange-600 italic">Rs. {profit.toFixed(2)}</td>
                        <td className="p-4 text-center">
                           <button onClick={() => setActiveBill({order, type: 'CUSTOMER'})} className="text-[9px] font-black underline hover:text-orange-600 uppercase">Bill</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LIVE VIEW - කලින් තිබූ ලස්සන කාඩ් ලේඅවුට් එක මෙතනට පමණයි */}
        {view === 'LIVE' && filteredOrders.map((order: any) => (
          <div key={order.id} className={`bg-white rounded-[2.5rem] shadow-xl border-l-[12px] p-6 sm:p-8 ${order.status === 'ACCEPTED' ? 'border-green-500' : 'border-orange-500'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 uppercase">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-300 block tracking-widest">ORD: {order.orderID}</span>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">{order.customerName}</h3>
                <p className="text-orange-600 font-black text-xl italic font-sans tracking-tighter">📞 {order.phone}</p>
                <p className="text-gray-400 text-xs font-bold leading-tight">🏠 {order.address}</p>
              </div>
              <div className="sm:text-right w-full sm:w-auto bg-zinc-50 p-4 rounded-[1.5rem] sm:bg-transparent sm:p-0">
                <span className="text-gray-400 text-[10px] font-black block tracking-widest uppercase font-sans">Total Amount</span>
                <span className="text-4xl font-black text-gray-900 italic tracking-tighter font-sans">Rs. {Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-50 rounded-[1.5rem] p-5 border border-zinc-100 mb-6 space-y-2 uppercase">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-200 last:border-0">
                  <span className="font-black text-gray-800 text-lg italic uppercase">🥡 {item.qty} X {item.name}</span>
                  <span className="font-bold text-gray-400 italic text-[10px] uppercase font-sans">{item.curryType} {item.currySize}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {order.status === 'Pending' ? (
                <button onClick={() => updateOrderStatus(order.id, 'ACCEPTED')} className="w-full bg-zinc-950 text-white font-black py-5 rounded-[1.5rem] shadow-xl text-xs uppercase tracking-[0.2em] italic">පිළිගන්න (ACCEPT ORDER)</button>
              ) : (
                <>
                  <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="w-full bg-green-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl text-xs uppercase tracking-[0.2em] mb-2 italic">MARK AS DELIVERED ✅</button>
                  <button onClick={() => setActiveBill({order, type: 'CHEF'})} className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-xl text-[9px] uppercase tracking-widest italic">Kitchen</button>
                  <button onClick={() => setActiveBill({order, type: 'CUSTOMER'})} className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-xl text-[9px] uppercase tracking-widest italic">Customer</button>
                </>
              )}
            </div>
          </div>
        ))}

        {/* ... MENU View (පරණ විදිහටමයි) ... */}
        {view === 'MENU' && menuSettings && (
           <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border-b-8 border-blue-600 uppercase italic">
              <h3 className="text-2xl font-black italic mb-6 border-b-2 border-gray-100 pb-2 uppercase tracking-tighter">My Item Costs</h3>
              {/* ... Menu items list ... */}
           </div>
        )}

        {filteredOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-zinc-100 italic">
            <p className="text-zinc-200 font-black text-2xl uppercase tracking-tighter">No items found.</p>
          </div>
        )}
      </div>

      {/* ... Bill Print View & Styles (පරණ විදිහටමයි) ... */}
      <style jsx global>{`
        @media print { .no-print { display: none !important; } body * { visibility: hidden; } .fixed, .fixed * { visibility: visible; } .fixed { position: absolute; left: 0; top: 0; width: 100%; } }
      `}</style>
    </div>
  );
}