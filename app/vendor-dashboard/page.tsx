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
  const [requestModal, setRequestModal] = useState<any>(null); // මිල වෙනස් කිරීමේ Modal එක

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

  // මිල වෙනස් කිරීමේ ඉල්ලීම Submit කිරීම
  const handlePriceRequest = async (e: any) => {
    e.preventDefault();
    const { itemId, currentCost, requestedCost, reason } = requestModal;
    if (!requestedCost || !reason) { alert("කරුණාකර සියලු විස්තර පුරවන්න."); return; }
    
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
      alert("මිල වෙනස් කිරීමේ ඉල්ලීම අයිතිකරු වෙත යැවුණා!");
      setRequestModal(null);
    } catch (err) { alert("Error: " + err); }
  };

  const calculateFinancials = (order: any) => {
    let totalVendorCost = 0;
    const sellingPrice = Number(order.totalAmount || 0);
    const deliveryFee = Number(order.deliveryFee || 0);

    order.items?.forEach((item: any) => {
      const itemKey = item.id || item.name.toLowerCase().replace(" ", "-");
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

  if (loading) return <div className="p-20 text-center font-black italic text-gray-300 animate-pulse uppercase tracking-[0.3em]">Restoring Original Layout...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 font-sans uppercase overflow-x-hidden">
      
      {/* RESTORED: Price Request Modal with Reason Box */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handlePriceRequest} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md border-b-8 border-blue-600 shadow-2xl relative">
            <button onClick={() => setRequestModal(null)} className="absolute top-6 right-6 font-black text-gray-400">✕</button>
            <h3 className="text-2xl font-black italic mb-2 tracking-tighter uppercase">Request Price Change</h3>
            <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest italic border-b pb-2">Item: {requestModal.itemId}</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 block mb-1">දැනට පවතින මිල (Current Share)</label>
                <input type="text" value={`Rs. ${requestModal.currentCost}`} disabled className="w-full bg-gray-50 p-4 rounded-2xl font-black border-2 border-gray-100 text-gray-400" />
              </div>
              <div>
                <label className="text-[10px] font-black text-blue-600 block mb-1 uppercase tracking-widest">New Requested Price</label>
                <input type="number" required onChange={(e) => setRequestModal({...requestModal, requestedCost: e.target.value})} className="w-full p-4 rounded-2xl font-black border-2 border-blue-100 focus:border-blue-500 outline-none shadow-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 block mb-1 uppercase tracking-widest">Reason for Change</label>
                <textarea required onChange={(e) => setRequestModal({...requestModal, reason: e.target.value})} className="w-full p-4 rounded-2xl font-bold border-2 border-gray-100 focus:border-blue-500 outline-none h-28 text-sm normal-case" placeholder="උදා: බඩු මිල වැඩිවීම නිසා..." />
              </div>
            </div>

            <button type="submit" className="w-full mt-8 bg-zinc-950 text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] shadow-lg hover:bg-blue-600 transition-all uppercase italic">Submit Request</button>
          </form>
        </div>
      )}

      {/* Bill Modal */}
      {activeBill && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 w-full max-w-[320px] text-black font-mono text-[11px] shadow-2xl rounded-xl">
             <div className="text-center border-b-2 border-black pb-3 mb-3 uppercase">
              <h2 className="font-black text-xl italic">{activeBill.type === 'CHEF' ? '👨‍🍳 KITCHEN' : '🧾 CUSTOMER'}</h2>
            </div>
            <p className="font-black mb-2 bg-black text-white px-2 py-1 inline-block">ID: {activeBill.order.orderID}</p>
            <div className="space-y-1 mb-4 uppercase">
              {activeBill.order.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="font-bold">{item.qty} X {item.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-2 no-print">
              <button onClick={() => window.print()} className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-black italic">PRINT</button>
              <button onClick={() => setActiveBill(null)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black italic uppercase">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto bg-zinc-950 text-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-600 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-[10px] font-black tracking-[0.4em] text-orange-500 mb-1 uppercase">Live Partner Board</h1>
          <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase">{vendor?.fullName}</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">📍 {vendor?.city} BRANCH</p>
        </div>
        <button onClick={() => { localStorage.removeItem('vendorPhone'); window.location.href = '/vendor-login'; }} className="bg-zinc-800 px-8 py-3 rounded-full font-black text-xs border border-zinc-700 hover:bg-red-600 transition-all uppercase italic">Logout</button>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto flex gap-2 mb-8 bg-white p-2 rounded-full shadow-sm border border-gray-200">
        <button onClick={() => setView('LIVE')} className={`flex-1 py-4 rounded-full font-black text-[10px] transition-all uppercase ${view === 'LIVE' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400'}`}>සජීවී ඇණවුම්</button>
        <button onClick={() => setView('HISTORY')} className={`flex-1 py-4 rounded-full font-black text-[10px] transition-all uppercase ${view === 'HISTORY' ? 'bg-zinc-900 text-white shadow-lg' : 'text-gray-400'}`}>ඉතිහාසය (HISTORY)</button>
        <button onClick={() => setView('MENU')} className={`flex-1 py-4 rounded-full font-black text-[10px] transition-all uppercase ${view === 'MENU' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>මගේ මෙනුව</button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HISTORY View - Financial Settlement Log */}
        {view === 'HISTORY' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border-2 border-black uppercase">
            <div className="bg-black text-white p-6 flex justify-between items-center">
              <h3 className="text-xl font-black italic tracking-tighter uppercase">Financial Settlement Log</h3>
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
                    const displayDate = order.orderDateOnly || (order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A');
                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <p className="font-black text-gray-900 italic text-sm">{order.customerName}</p>
                          <div className="text-[9px] text-orange-600 mt-1 uppercase italic">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i}>🥡 {item.qty} X {item.name}</div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-center text-[9px] font-black text-gray-400">{order.orderID}</td>
                        <td className="p-4 text-center text-[10px] font-black text-gray-500">{displayDate}</td>
                        <td className="p-4 text-right font-black">Rs. {sellingPrice.toFixed(2)}</td>
                        <td className="p-4 text-right font-black bg-blue-50/50 text-blue-600 italic">Rs. {vendorCost.toFixed(2)}</td>
                        <td className="p-4 text-right font-black bg-orange-50/50 text-orange-600 italic">Rs. {profit.toFixed(2)}</td>
                        <td className="p-4 text-center">
                           <button onClick={() => setActiveBill({order, type: 'CUSTOMER'})} className="text-[9px] font-black underline hover:text-orange-600 uppercase italic">Bill</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LIVE VIEW */}
        {view === 'LIVE' && filteredOrders.map((order: any) => (
          <div key={order.id} className={`bg-white rounded-[2.5rem] shadow-xl border-l-[12px] p-6 sm:p-8 ${order.status === 'ACCEPTED' ? 'border-green-500' : 'border-orange-500'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 uppercase italic">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-300 block tracking-widest uppercase font-sans">ID: {order.orderID}</span>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">{order.customerName}</h3>
                <p className="text-orange-600 font-black text-xl italic font-sans italic tracking-tighter">📞 {order.phone}</p>
              </div>
              <div className="sm:text-right w-full sm:w-auto bg-zinc-50 p-4 rounded-[1.5rem] sm:bg-transparent sm:p-0">
                <span className="text-gray-400 text-[10px] font-black block tracking-widest uppercase font-sans">Total Bill</span>
                <span className="text-4xl font-black text-gray-900 italic tracking-tighter font-sans">Rs. {Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-zinc-50 rounded-[1.5rem] p-5 border border-zinc-100 mb-6 space-y-2 uppercase font-bold italic">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-200 last:border-0">
                  <span className="font-black text-gray-800 text-lg uppercase italic font-sans tracking-tighter">🥡 {item.qty} X {item.name}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {order.status === 'Pending' ? (
                <button onClick={() => updateOrderStatus(order.id, 'ACCEPTED')} className="w-full bg-zinc-950 text-white font-black py-5 rounded-[1.5rem] shadow-xl text-xs uppercase tracking-[0.2em] italic transition-all hover:bg-orange-600">පිළිගන්න (ACCEPT ORDER)</button>
              ) : (
                <>
                  <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="flex-[3] bg-green-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl text-xs uppercase tracking-[0.2em] italic">MARK AS DELIVERED ✅</button>
                  <button onClick={() => setActiveBill({order, type: 'CHEF'})} className="flex-1 bg-zinc-900 text-white flex items-center justify-center rounded-[1.2rem] shadow-md border-2 border-zinc-700 hover:bg-orange-600 transition-all">
                    <span className="text-[9px] font-black italic uppercase">Kitchen</span>
                  </button>
                  <button onClick={() => setActiveBill({order, type: 'CUSTOMER'})} className="flex-1 bg-zinc-900 text-white flex items-center justify-center rounded-[1.2rem] shadow-md border-2 border-zinc-700 hover:bg-orange-600 transition-all">
                    <span className="text-[9px] font-black italic uppercase">Bill</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {/* RESTORED: MENU VIEW with "Change" Button */}
        {view === 'MENU' && menuSettings && (
           <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border-b-8 border-blue-600 uppercase italic tracking-tighter">
              <h3 className="text-2xl font-black italic mb-8 border-b-2 border-gray-100 pb-2 uppercase">My Items Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(menuSettings).map(([id, data]: [string, any]) => (
                  <div key={id} className="bg-zinc-50 p-6 rounded-[2rem] border-2 border-zinc-100 shadow-sm flex flex-col justify-between gap-4">
                    <div>
                      <h4 className="font-black text-xl italic uppercase text-zinc-800 tracking-tighter border-b pb-1 mb-2">{id}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Your Share: <span className="text-blue-600 text-base">Rs. {data.cost}</span></p>
                    </div>
                    <button 
                      onClick={() => setRequestModal({itemId: id, currentCost: data.cost})} 
                      className="w-full bg-zinc-950 text-white py-3 rounded-2xl font-black text-[9px] tracking-widest uppercase italic hover:bg-blue-600 transition-all shadow-md"
                    >
                      Change Price
                    </button>
                  </div>
                ))}
              </div>
           </div>
        )}
      </div>

      <style jsx global>{`
        @media print { .no-print { display: none !important; } body * { visibility: hidden; } .fixed, .fixed * { visibility: visible; } .fixed { position: absolute; left: 0; top: 0; width: 100%; } }
      `}</style>
    </div>
  );
}