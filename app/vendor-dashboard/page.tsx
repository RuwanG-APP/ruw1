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

  const handlePriceRequest = async (e: any) => {
    e.preventDefault();
    const { itemId, currentCost, requestedCost, reason } = requestModal;
    try {
      await addDoc(collection(db, 'price_requests'), {
        vendorPhone: savedPhone,
        vendorName: vendor?.fullName,
        itemId, currentCost, requestedCost: parseFloat(requestedCost),
        reason, status: 'PENDING', createdAt: serverTimestamp()
      });
      alert("ඉල්ලීම සාර්ථකව යැවුණා!");
      setRequestModal(null);
    } catch (err) { alert("Error: " + err); }
  };

  const filteredOrders = orders.filter((o: any) => {
    if (view === 'LIVE') return (o.status === 'Pending' || (o.status === 'ACCEPTED' && o.vendorPhone === savedPhone));
    if (view === 'HISTORY') return (o.status === 'DELIVERED' && o.vendorPhone === savedPhone);
    return false;
  });

  // ලාභය ගණනය කරන ලොජික් එක (History Table එක සඳහා)
  const calculateFinancials = (order: any) => {
    let totalVendorPayout = 0;
    order.items?.forEach((item: any) => {
      const itemKey = item.name.toLowerCase().replace(" ", "-");
      const costPerUnit = menuSettings?.[itemKey]?.cost || (item.price / item.qty) * 0.8; // Fallback if no setting
      totalVendorPayout += (costPerUnit * item.qty);
    });
    // සරල බව සඳහා: Payout = Selling Price - Profit (Profit එක දළ වශයෙන් 15%)
    const sellingPrice = Number(order.totalAmount || 0);
    const profit = sellingPrice * 0.15; // මේක ඔයාට ඕන පර්සන්ටේජ් එකකට පස්සේ හදන්න පුළුවන්
    const vendorCost = sellingPrice - profit;
    
    return { sellingPrice, vendorCost, profit };
  };

  if (loading) return <div className="p-20 text-center font-black italic text-gray-300">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 font-sans uppercase overflow-x-hidden">
      
      {/* Price Request Modal (Popup) */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handlePriceRequest} className="bg-white p-8 rounded-[2rem] w-full max-w-md border-b-8 border-orange-600 shadow-2xl">
            <h3 className="text-2xl font-black italic mb-4">REQUEST COST CHANGE</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 block mb-1 uppercase">Item ID: {requestModal.itemId}</label>
                <input type="number" required onChange={(e) => setRequestModal({...requestModal, requestedCost: e.target.value})} className="w-full p-4 rounded-xl font-black border-2 border-orange-100 outline-none" placeholder="NEW COST (Rs)" />
              </div>
              <textarea required onChange={(e) => setRequestModal({...requestModal, reason: e.target.value})} className="w-full p-4 rounded-xl font-bold border-2 border-gray-100 outline-none h-24 text-sm" placeholder="හේතුව සඳහන් කරන්න..." />
            </div>
            <div className="flex gap-2 mt-6">
              <button type="submit" className="flex-1 bg-zinc-950 text-white py-4 rounded-xl font-black text-xs tracking-widest">SUBMIT</button>
              <button type="button" onClick={() => setRequestModal(null)} className="px-6 py-4 font-black text-xs text-gray-400">CANCEL</button>
            </div>
          </form>
        </div>
      )}

      {/* Header */}
      <div className="max-w-5xl mx-auto bg-zinc-950 text-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border-b-8 border-orange-600 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-[10px] font-black tracking-[0.4em] text-orange-500 mb-1">Live Partner Board</h1>
          <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter">{vendor?.fullName}</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-2 tracking-widest">📍 {vendor?.city} BRANCH</p>
        </div>
        <button onClick={() => { localStorage.removeItem('vendorPhone'); window.location.href = '/vendor-login'; }} className="bg-zinc-800 px-8 py-3 rounded-full font-black text-[10px] border border-zinc-700 hover:bg-red-600 transition-all">LOGOUT</button>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto flex gap-2 mb-8 bg-white p-2 rounded-[2rem] shadow-sm border border-gray-200">
        <button onClick={() => setView('LIVE')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] tracking-widest transition-all ${view === 'LIVE' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400'}`}>LIVE ORDERS</button>
        <button onClick={() => setView('HISTORY')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] tracking-widest transition-all ${view === 'HISTORY' ? 'bg-zinc-900 text-white shadow-lg' : 'text-gray-400'}`}>HISTORY</button>
        <button onClick={() => setView('MENU')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] tracking-widest transition-all ${view === 'MENU' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>MY MENU</button>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* HISTORY View - මෙන්න ඔයා ඉල්ලපු ටේබල් එක */}
        {view === 'HISTORY' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border-2 border-black mb-10">
            <div className="bg-black text-white p-6 flex justify-between items-center">
              <h3 className="text-xl font-black italic tracking-tighter">FINANCIAL SETTLEMENT LOG</h3>
              <span className="text-[10px] font-bold bg-orange-600 px-3 py-1 rounded-full uppercase">Transparency Mode ON</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b-2 border-black font-black text-[9px] sm:text-[10px] tracking-widest text-zinc-500">
                    <th className="p-4 text-left">NAME</th>
                    <th className="p-4 text-center">ORD NO</th>
                    <th className="p-4 text-center">DATE</th>
                    <th className="p-4 text-right">SELLING PRICE</th>
                    <th className="p-4 text-right bg-blue-50 text-blue-900 font-black italic">COST (PAYOUT)</th>
                    <th className="p-4 text-right bg-orange-50 text-orange-700 font-black italic">PROFIT</th>
                  </tr>
                </thead>
                <tbody className="font-sans">
                  {filteredOrders.map((order: any) => {
                    const { sellingPrice, vendorCost, profit } = calculateFinancials(order);
                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-black text-sm text-gray-900 italic uppercase">{order.customerName}</td>
                        <td className="p-4 text-center text-[10px] font-bold text-gray-400">#{order.orderID?.slice(-6)}</td>
                        <td className="p-4 text-center text-[10px] font-bold text-gray-500">{order.orderDateOnly || 'N/A'}</td>
                        <td className="p-4 text-right font-black text-gray-900">Rs. {sellingPrice.toFixed(2)}</td>
                        <td className="p-4 text-right font-black text-blue-600 bg-blue-50 italic">Rs. {vendorCost.toFixed(2)}</td>
                        <td className="p-4 text-right font-black text-orange-600 bg-orange-50 italic">Rs. {profit.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MENU View */}
        {view === 'MENU' && menuSettings && (
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border-b-8 border-blue-600">
            <h3 className="text-2xl font-black italic mb-6 border-b-2 border-gray-100 pb-2">MY ITEM COSTS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(menuSettings).map(([id, data]: [string, any]) => (
                <div key={id} className="flex justify-between items-center bg-zinc-50 p-6 rounded-[2rem] border-2 border-zinc-100">
                  <div>
                    <h4 className="font-black text-lg italic uppercase text-zinc-800">{id}</h4>
                    <p className="text-[10px] font-bold text-gray-400">YOUR COST: <span className="text-blue-600 text-sm">Rs. {data.cost}</span></p>
                  </div>
                  <button onClick={() => setRequestModal({itemId: id, currentCost: data.cost})} className="bg-zinc-950 text-white px-5 py-2 rounded-full font-black text-[9px] hover:bg-orange-600 transition-all uppercase">Request Change</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDER CARDS (LIVE & HISTORY) */}
        {view !== 'MENU' && filteredOrders.map((order: any) => (
          <div key={order.id} className={`bg-white rounded-[2.5rem] shadow-xl border-l-[12px] p-6 sm:p-8 transition-all ${order.status === 'ACCEPTED' ? 'border-green-500' : order.status === 'DELIVERED' ? 'border-zinc-300' : 'border-orange-500'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-300 block tracking-widest uppercase">ORD: {order.orderID}</span>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">{order.customerName}</h3>
                <p className="text-orange-600 font-black text-xl italic font-sans tracking-tighter">📞 {order.phone}</p>
              </div>
              <div className="sm:text-right w-full sm:w-auto bg-zinc-50 p-4 rounded-[1.5rem] sm:bg-transparent sm:p-0">
                <span className="text-gray-400 text-[10px] font-black block tracking-widest uppercase">Total Bill</span>
                <span className="text-4xl font-black text-gray-900 italic tracking-tighter font-sans">Rs. {Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-50 rounded-[1.5rem] p-5 border border-zinc-100 mb-6 space-y-2">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-200 last:border-0">
                  <span className="font-black text-gray-800 text-lg italic uppercase">🥡 {item.qty} X {item.name}</span>
                  <span className="font-bold text-gray-400 italic text-[10px] uppercase">{item.curryType} {item.currySize}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {order.status === 'Pending' && (
                <button onClick={() => updateOrderStatus(order.id, 'ACCEPTED')} className="w-full bg-zinc-950 text-white font-black py-5 rounded-[1.5rem] shadow-xl text-xs uppercase tracking-[0.2em]">පිළිගන්න (ACCEPT ORDER)</button>
              )}
              {order.status === 'ACCEPTED' && (
                <>
                  <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="w-full bg-green-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl text-xs uppercase tracking-[0.2em] mb-2">DELIVERED ✅</button>
                  <button onClick={() => setActiveBill({order, type: 'CHEF'})} className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-xl text-[9px] uppercase tracking-widest">KITCHEN BILL</button>
                  <button onClick={() => setActiveBill({order, type: 'CUSTOMER'})} className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-xl text-[9px] uppercase tracking-widest">CUSTOMER BILL</button>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-zinc-100">
            <p className="text-zinc-200 font-black text-2xl italic tracking-tighter uppercase">No orders found in this section.</p>
          </div>
        )}
      </div>
    </div>
  );
}