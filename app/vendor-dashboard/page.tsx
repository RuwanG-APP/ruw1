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
    if (!window.confirm("මෙම ඇණවුමේ තත්ත්වය වෙනස් කිරීමට අවශ්‍යද?")) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus, vendorPhone: savedPhone });
    } catch (err) { alert("Error: " + err); }
  };

  const calculateFinancials = (order: any) => {
    let totalVendorCost = 0;
    const sellingPrice = Number(order.totalAmount || 0);
    const deliveryFee = Number(order.deliveryFee || 0);

    order.items?.forEach((item: any) => {
      const itemKey = item.id || (typeof item.name === 'string' ? item.name.toLowerCase().replace(" ", "-") : '');
      const setting = menuSettings?.[itemKey];
      if (setting && setting.cost) {
        totalVendorCost += (Number(setting.cost) * item.qty);
      } else {
        totalVendorCost += (item.price * 0.8);
      }
    });

    const profit = sellingPrice - deliveryFee - totalVendorCost;
    return { sellingPrice, vendorCost: totalVendorCost, profit, deliveryFee };
  };

  const filteredOrders = orders.filter((o: any) => {
    if (view === 'LIVE') return (o.status === 'Pending' || (o.status === 'ACCEPTED' && o.vendorPhone === savedPhone));
    if (view === 'HISTORY') return (o.status === 'DELIVERED' && o.vendorPhone === savedPhone);
    return false;
  });

  if (loading) return <div className="p-20 text-center font-black italic text-gray-300 animate-pulse uppercase tracking-[0.3em]">Restoring Track...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 font-sans uppercase overflow-x-hidden">
      
      {/* 🧾 RESTORED: Full Professional Bill Modal */}
      {activeBill && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 w-full max-w-[360px] text-black font-mono shadow-2xl rounded-3xl border-t-8 border-black animate-in fade-in zoom-in duration-200">
            
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <h2 className="font-black text-2xl italic tracking-tighter uppercase leading-none">
                {activeBill.type === 'CHEF' ? '👨‍🍳 KITCHEN ORDER' : '🧾 CUSTOMER BILL'}
              </h2>
              <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-widest italic">Week Out - {vendor?.city} Branch</p>
            </div>

            <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between">
                <span className="text-[9px] font-black text-gray-400 uppercase">Order ID:</span>
                <span className="text-[9px] font-black">{activeBill.order.orderID}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-[9px] font-black text-gray-400 uppercase">Date:</span>
                <span className="text-[9px] font-black">{activeBill.order.orderDateOnly || new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Customer Information Section */}
            {activeBill.type === 'CUSTOMER' && (
              <div className="mb-6 space-y-1 bg-zinc-50 p-4 rounded-2xl border-l-4 border-orange-500">
                <h4 className="text-[9px] font-black text-gray-400 mb-2 tracking-widest uppercase">Delivery Details</h4>
                <p className="text-sm font-black italic uppercase leading-none">{activeBill.order.customerName}</p>
                <p className="text-xs font-bold tracking-tighter font-sans">📞 {activeBill.order.phone}</p>
                <p className="text-[10px] font-medium leading-tight text-gray-600 normal-case italic mt-1 font-sans">🏠 {activeBill.order.address}</p>
              </div>
            )}

            {/* Items List Section */}
            <div className="space-y-4 mb-6">
              <h4 className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Items Ordered</h4>
              {activeBill.order.items?.map((item: any, i: number) => {
                // Clean the item name from double quantity strings
                const cleanName = (typeof item.name === 'string') ? item.name.replace(/^\d+ x /i, '') : item.name;
                return (
                  <div key={i} className="flex justify-between items-start border-b border-gray-100 pb-2">
                    <div className="flex flex-col">
                      <span className="font-black text-xs uppercase italic leading-tight">{item.qty} X {cleanName}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase italic mt-1">{item.curryType} {item.currySize}</span>
                    </div>
                    {activeBill.type === 'CUSTOMER' && <span className="font-black text-xs italic">Rs.{Number(item.price).toFixed(2)}</span>}
                  </div>
                );
              })}
            </div>

            {/* Financial Summary */}
            {activeBill.type === 'CUSTOMER' && (
              <div className="text-right border-t-2 border-black pt-4">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Bill Amount</p>
                <p className="text-3xl font-black italic tracking-tighter leading-none font-sans">RS. {Number(activeBill.order.totalAmount).toFixed(2)}</p>
              </div>
            )}

            <div className="mt-8 flex gap-3 no-print">
              <button onClick={() => window.print()} className="flex-[2] bg-zinc-950 text-white py-4 rounded-2xl font-black text-xs tracking-widest shadow-lg hover:bg-orange-600 transition-all italic">PRINT REPORT</button>
              <button onClick={() => setActiveBill(null)} className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black text-xs tracking-widest uppercase italic">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto bg-zinc-950 text-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-600 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-[10px] font-black tracking-[0.4em] text-orange-500 mb-1 uppercase italic">Live Partner Board</h1>
          <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase leading-none">{vendor?.fullName}</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest italic">📍 {vendor?.city} BRANCH</p>
        </div>
        <button onClick={() => { localStorage.removeItem('vendorPhone'); window.location.href = '/vendor-login'; }} className="bg-zinc-800 px-8 py-3 rounded-full font-black text-xs border border-zinc-700 uppercase italic hover:bg-red-600 transition-all">Logout</button>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto flex gap-2 mb-8 bg-white p-2 rounded-full shadow-sm border border-gray-200">
        <button onClick={() => setView('LIVE')} className={`flex-1 py-4 rounded-full font-black text-[10px] transition-all uppercase italic ${view === 'LIVE' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400'}`}>සජීවී ඇණවුම්</button>
        <button onClick={() => setView('HISTORY')} className={`flex-1 py-4 rounded-full font-black text-[10px] transition-all uppercase italic ${view === 'HISTORY' ? 'bg-zinc-900 text-white shadow-lg' : 'text-gray-400'}`}>ඉතිහාසය (HISTORY)</button>
        <button onClick={() => setView('MENU')} className={`flex-1 py-4 rounded-full font-black text-[10px] transition-all uppercase italic ${view === 'MENU' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>මගේ මෙනුව</button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HISTORY View - Financial Settlement Log */}
        {view === 'HISTORY' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border-2 border-black">
            <div className="bg-black text-white p-6 flex justify-between items-center">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Settlement Log</h3>
              <span className="text-[8px] font-black bg-orange-600 px-3 py-1 rounded-full italic tracking-widest">TRANSPARENCY MODE</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b-2 border-black font-black text-[10px] tracking-widest text-zinc-500 uppercase">
                    <th className="p-4 text-left">Customer / Items</th>
                    <th className="p-4 text-center">Order No</th>
                    <th className="p-4 text-center">Date</th>
                    <th className="p-4 text-right">Selling Price</th>
                    <th className="p-4 text-right bg-blue-50 text-blue-900 font-black italic">Cost (Payout)</th>
                    <th className="p-4 text-right bg-orange-50 text-orange-700 font-black italic">Profit</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-[11px] font-bold uppercase tracking-tight">
                  {filteredOrders.map((order: any) => {
                    const { sellingPrice, vendorCost, profit } = calculateFinancials(order);
                    const displayDate = order.orderDateOnly || (order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'TODAY');
                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <p className="font-black text-gray-900 italic text-sm leading-none mb-1">{order.customerName}</p>
                          <div className="text-[8px] text-orange-600 italic uppercase">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i}>🥡 {item.qty} X {item.name.replace(/^\d+ x /i, '')}</div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-tighter">{order.orderID}</td>
                        <td className="p-4 text-center text-[9px] font-black text-gray-500">{displayDate}</td>
                        <td className="p-4 text-right font-black text-sm">Rs.{sellingPrice.toFixed(2)}</td>
                        <td className="p-4 text-right font-black bg-blue-50/50 text-blue-600 italic">Rs.{vendorCost.toFixed(2)}</td>
                        <td className="p-4 text-right font-black bg-orange-50/50 text-orange-600 italic">Rs.{profit.toFixed(2)}</td>
                        <td className="p-4 text-center">
                           <button onClick={() => setActiveBill({order, type: 'CUSTOMER'})} className="px-3 py-1 bg-zinc-900 text-white rounded-lg text-[8px] font-black italic hover:bg-orange-600 transition-all uppercase">BILL</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LIVE VIEW - Traditional Cards */}
        {view === 'LIVE' && filteredOrders.map((order: any) => (
          <div key={order.id} className={`bg-white rounded-[2.5rem] shadow-xl border-l-[12px] p-6 sm:p-8 ${order.status === 'ACCEPTED' ? 'border-green-500' : 'border-orange-500'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 uppercase italic">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-300 block tracking-widest uppercase font-sans tracking-widest">ID: {order.orderID}</span>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase leading-none">{order.customerName}</h3>
                <p className="text-orange-600 font-black text-xl italic font-sans italic tracking-tighter mt-1">📞 {order.phone}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-2 normal-case leading-tight">🏠 {order.address}</p>
              </div>
              <div className="sm:text-right w-full sm:w-auto bg-zinc-50 p-4 rounded-[1.5rem] sm:bg-transparent sm:p-0">
                <span className="text-gray-400 text-[10px] font-black block tracking-widest uppercase font-sans">Amount Due</span>
                <span className="text-4xl font-black text-gray-900 italic tracking-tighter font-sans leading-none">Rs. {Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-50 rounded-[1.5rem] p-5 border border-zinc-100 mb-6 space-y-2 uppercase font-bold italic">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-200 last:border-0">
                  <span className="font-black text-gray-800 text-lg uppercase italic font-sans tracking-tighter">🥡 {item.qty} X {item.name.replace(/^\d+ x /i, '')}</span>
                  <span className="text-[9px] text-gray-400 uppercase font-sans tracking-widest">{item.curryType} {item.currySize}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {order.status === 'Pending' ? (
                <button onClick={() => updateOrderStatus(order.id, 'ACCEPTED')} className="w-full bg-zinc-950 text-white font-black py-5 rounded-[1.5rem] shadow-xl text-xs uppercase tracking-[0.2em] italic hover:bg-orange-600 transition-all">පිළිගන්න (ACCEPT ORDER)</button>
              ) : (
                <>
                  <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="flex-[3] bg-green-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl text-xs uppercase tracking-[0.2em] italic hover:bg-green-700 transition-all">MARK AS DELIVERED ✅</button>
                  <button onClick={() => setActiveBill({order, type: 'CHEF'})} className="flex-1 bg-zinc-900 text-white flex items-center justify-center rounded-[1.2rem] shadow-md border-2 border-zinc-700 hover:bg-orange-600 transition-all">
                    <span className="text-[9px] font-black italic uppercase">Kitchen</span>
                  </button>
                  <button onClick={() => setActiveBill({order, type: 'CUSTOMER'})} className="flex-1 bg-zinc-900 text-white flex items-center justify-center rounded-[1.2rem] shadow-md border-2 border-zinc-700 hover:bg-orange-600 transition-all">
                    <span className="text-[9px] font-black italic uppercase tracking-widest">Bill</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print { .no-print { display: none !important; } body * { visibility: hidden; } .fixed, .fixed * { visibility: visible; } .fixed { position: absolute; left: 0; top: 0; width: 100%; } }
      `}</style>
    </div>
  );
}