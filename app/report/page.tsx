// app/report/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore'; 
import { db } from '../firebase';

export default function DailyReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [menuCosts, setMenuCosts] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  const checkPass = () => {
    if (pass === 'ruwan123') setIsAuth(true);
    else alert('වැරදි මුරපදයක්!');
  };

  useEffect(() => {
    // 1. Settings වලට සවන් දීම
    const unsubSettings = onSnapshot(doc(db, 'settings', 'menu'), (snap) => {
      if (snap.exists()) setMenuCosts(snap.data());
    });

    // 2. ඕඩර්ස් වලට සවන් දීම
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
    const unsubOrders = onSnapshot(q, (snapshot) => {
      const today = new Date().toLocaleDateString();
      const todayOrders: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const orderDate = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : '';
        if (orderDate === today) todayOrders.push({ id: doc.id, ...data });
      });
      setOrders(todayOrders);
      setLoading(false);
    });

    return () => { unsubSettings(); unsubOrders(); };
  }, []);

  // --- අතිශය වැදගත්: ලාභය ගණනය කිරීමේ සුපිරි ක්‍රමය ---
  const breakdown = orders.reduce((acc, order) => {
    acc.totalDelivery += (order.deliveryFee || 0);

    order.items?.forEach((item: any) => {
      // නමේ මුල් කොටස විතරක් ගැනීම (උදා: "Kottu (Half)" නම් "kottu" ලෙස ගනී)
      const baseName = item.name.split(' ')[0].split('(')[0].trim().toLowerCase();
      
      // Settings වල තියෙන key එක සමඟ ගැලපීම
      const menuKey = Object.keys(menuCosts).find(k => k.includes(baseName)) || baseName;
      const cost = menuCosts[menuKey]?.cost || 0;
      
      const profit = (item.price - cost) * (item.qty || 1);
      const displayName = baseName.toUpperCase();
      
      acc.itemProfits[displayName] = (acc.itemProfits[displayName] || 0) + profit;
    });
    return acc;
  }, { totalDelivery: 0, itemProfits: {} as any });

  const grandTotalAll = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalNetProfit = Object.values(breakdown.itemProfits).reduce((a: any, b: any) => a + b, 0);

  // --- Handover & Print Functions ---
  const handleHandover = async (id: string) => { await updateDoc(doc(db, "orders", id), { status: "Handovered" }); };
  const printSlip = (order: any, type: string) => { /* ... කලින් දුන්න print code එක මෙතන තියෙනවා ... */ };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center w-full max-w-sm">
          <h2 className="text-xl font-black mb-6 uppercase text-zinc-400">Week Out Admin</h2>
          <input type="password" onChange={(e)=>setPass(e.target.value)} placeholder="ENTER PIN" className="w-full bg-white text-black p-4 rounded-xl text-center mb-4 font-bold text-lg outline-none" />
          <button onClick={checkPass} className="w-full bg-orange-600 py-4 rounded-xl font-black uppercase text-white shadow-lg">Unlock System</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 text-black font-sans">
      <div className="max-w-7xl mx-auto border-2 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Week Out - Online Foods</h1>
          <h2 className="text-xs font-bold text-gray-500 tracking-[0.3em] uppercase">Owner's Dashboard</h2>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto mb-10">
          <table className="w-full border-2 border-black">
            <thead className="bg-zinc-100 text-[11px] uppercase font-black">
              <tr>
                <th className="border-2 border-black p-2">Order ID</th>
                <th className="border-2 border-black p-2 text-left">Customer & Items</th>
                <th className="border-2 border-black p-2 text-right">Amount</th>
                <th className="border-2 border-black p-2">Bank</th>
                <th className="border-2 border-black p-2 text-right">Total</th>
                <th className="border-2 border-black p-2 no-print">Manage</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className={`border-b border-black/10 ${order.status === 'Handovered' ? 'bg-green-50' : ''}`}>
                  <td className="border-r border-black p-2 font-mono text-[10px] font-bold">{order.orderID}</td>
                  <td className="border-r border-black p-2 text-sm">
                    <div className="font-black text-blue-700 text-xs uppercase mb-1">{order.customerName}</div>
                    {order.items?.map((it:any, i:number) => <div key={i} className="text-[10px] leading-tight">• {it.name} <small className="text-gray-400">(${it.details})</small></div>)}
                  </td>
                  <td className="border-r border-black p-2 text-right font-mono text-xs">{order.subTotal?.toFixed(2)}</td>
                  <td className="border-r border-black p-2 text-center text-blue-600 font-bold">{order.paymentMethod === 'Online' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-right font-black bg-zinc-50">{order.totalAmount?.toFixed(2)}</td>
                  <td className="p-2 no-print flex gap-1 items-center">
                      <button onClick={() => printSlip(order, 'KITCHEN')} className="bg-zinc-800 text-white text-[9px] px-2 py-1.5 rounded font-black">CHEF</button>
                      <button onClick={() => printSlip(order, 'CUSTOMER')} className="bg-blue-600 text-white text-[9px] px-2 py-1.5 rounded font-black">BILL</button>
                      {order.status !== 'Handovered' ? (
                        <button onClick={() => handleHandover(order.id)} className="bg-orange-600 text-white text-[9px] px-2 py-1.5 rounded font-black uppercase">Handover</button>
                      ) : (
                        <span className="text-green-600 font-black text-[9px] ml-1">✅</span>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- අයිතිකාරයාට ඕනේ කරන සුපිරි කොටස --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="border-2 border-black p-5 relative">
            <h3 className="absolute -top-3 left-4 bg-yellow-400 px-3 font-black text-xs border-2 border-black">PROFIT BY ITEM</h3>
            <div className="mt-2 space-y-3">
              {Object.entries(breakdown.itemProfits).map(([name, profit]: any) => (
                <div key={name} className="flex justify-between items-center border-b border-dashed border-zinc-300 pb-1">
                  <span className="font-bold text-sm text-zinc-600">{name}</span>
                  <span className="font-black text-green-700">Rs. {profit.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-black p-4 flex justify-between items-center bg-blue-50">
               <span className="font-black text-xs uppercase">Daily Delivery Income:</span>
               <span className="text-xl font-black text-blue-800">Rs. {breakdown.totalDelivery.toFixed(2)}</span>
            </div>

            <div className="border-2 border-black p-4 flex justify-between items-center bg-green-50">
               <span className="font-black text-xs uppercase text-green-900">Total Food Profit:</span>
               <span className="text-2xl font-black text-green-700 underline decoration-green-300">Rs. {totalNetProfit.toFixed(2)}</span>
            </div>

            <div className="bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] border-2 border-black">
              <div className="flex justify-between items-center">
                <span className="text-xl font-black uppercase">Grand Total:</span>
                <span className="text-4xl font-black text-orange-400">Rs. {grandTotalAll.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-10 flex justify-center gap-4 no-print">
           <button onClick={() => window.location.href='/admin/settings'} className="border-2 border-black px-8 py-3 font-black text-xs uppercase hover:bg-zinc-100 transition-all">⚙️ Business Settings</button>
           <button onClick={() => window.print()} className="bg-zinc-900 text-white border-2 border-black px-10 py-3 font-black text-xs uppercase hover:bg-black transition-all shadow-xl">🖨️ Print Report</button>
        </div>
      </div>
    </div>
  );
}