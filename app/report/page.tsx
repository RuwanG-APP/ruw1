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
    const unsubSettings = onSnapshot(doc(db, 'settings', 'menu'), (snap) => {
      if (snap.exists()) setMenuCosts(snap.data());
    });

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

  // --- අයිතිකාරයාට අවශ්‍ය ගණන් හිලව් (Insights Logic) ---
  const breakdown = orders.reduce((acc, order) => {
    // 1. ඩිලිවරි ගාස්තු එකතුව
    acc.totalDelivery += (order.deliveryFee || 0);

    // 2. කෑම වර්ග අනුව ලාභය
    order.items?.forEach((item: any) => {
      const key = item.name.toLowerCase().replace(/\s+/g, '-');
      const cost = menuCosts[key]?.cost || 0;
      const profit = (item.price - cost) * (item.qty || 1);
      
      acc.itemProfits[item.name] = (acc.itemProfits[item.name] || 0) + profit;
    });
    return acc;
  }, { totalDelivery: 0, itemProfits: {} as any });

  const grandTotalAll = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalNetProfit = Object.values(breakdown.itemProfits).reduce((a: any, b: any) => a + b, 0);

  // --- Print Function (Previous logic kept) ---
  const printSlip = (order: any, type: string) => { /* ... print code ... */ };
  const handleHandover = async (id: string) => { await updateDoc(doc(db, "orders", id), { status: "Handovered" }); };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black font-sans">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center w-full max-w-sm">
          <h2 className="text-xl font-black mb-6 uppercase text-zinc-400">Week Out Admin</h2>
          <input type="password" onChange={(e)=>setPass(e.target.value)} placeholder="ENTER PIN" className="w-full bg-white text-black p-4 rounded-xl text-center mb-4 font-bold text-lg outline-none" />
          <button onClick={checkPass} className="w-full bg-orange-600 py-4 rounded-xl font-black uppercase text-white shadow-lg active:scale-95 transition-all">Unlock System</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 text-black font-sans">
      <div className="max-w-7xl mx-auto border-2 border-black p-6">
        
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Week Out - Online Foods</h1>
          <h2 className="text-sm font-bold text-gray-500 tracking-[0.2em]">LIVE PERFORMANCE REPORT</h2>
        </div>

        {/* Orders Table - පරණ ආකෘතියමයි */}
        <div className="overflow-x-auto mb-10">
          <table className="w-full border-2 border-black">
            <thead className="bg-zinc-100 text-[10px] uppercase font-black">
              <tr>
                <th className="border-2 border-black p-2">Order ID</th>
                <th className="border-2 border-black p-2 text-left">Item Details</th>
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
                  <td className="border-r border-black p-2 text-sm uppercase">
                    <div className="font-black text-blue-700 text-[11px]">{order.customerName}</div>
                    {order.items?.map((it:any, i:number) => <div key={i} className="text-[10px]">• {it.name} <small>(${it.details})</small></div>)}
                  </td>
                  <td className="border-r border-black p-2 text-right font-mono text-xs">{order.subTotal?.toFixed(2)}</td>
                  <td className="border-r border-black p-2 text-center text-blue-600 font-bold">{order.paymentMethod === 'Online' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-right font-black bg-zinc-50">{order.totalAmount?.toFixed(2)}</td>
                  <td className="p-2 no-print flex gap-1">
                      <button onClick={() => printSlip(order, 'KITCHEN')} className="bg-zinc-800 text-white text-[9px] p-2 rounded font-black">CHEF</button>
                      <button onClick={() => printSlip(order, 'CUSTOMER')} className="bg-blue-600 text-white text-[9px] p-2 rounded font-black">BILL</button>
                      {order.status !== 'Handovered' && <button onClick={() => handleHandover(order.id)} className="bg-orange-600 text-white text-[9px] p-2 rounded font-black">DONE</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- ඔයා ඉල්ලපු අලුත් කොටස (Daily Insights) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Item-wise Profit Breakdown */}
          <div className="border-2 border-black p-4">
            <h3 className="font-black uppercase text-xs border-b-2 border-black mb-3 pb-1 bg-yellow-300 px-2 inline-block">Profit by Category</h3>
            <div className="space-y-2">
              {Object.entries(breakdown.itemProfits).map(([name, profit]: any) => (
                <div key={name} className="flex justify-between text-sm font-bold border-b border-dashed border-zinc-200 pb-1">
                  <span className="uppercase text-gray-600">{name}:</span>
                  <span className="text-green-700">Rs. {profit.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Delivery */}
          <div className="space-y-3">
            <div className="border-2 border-black p-4 flex justify-between items-center bg-blue-50">
               <span className="font-black uppercase text-xs">Total Delivery Fees:</span>
               <span className="text-xl font-black text-blue-700">Rs. {breakdown.totalDelivery.toFixed(2)}</span>
            </div>

            <div className="border-2 border-black p-4 flex justify-between items-center bg-green-50">
               <span className="font-black uppercase text-xs text-green-900">Estimated Food Profit:</span>
               <span className="text-2xl font-black text-green-700 underline">Rs. {totalNetProfit.toFixed(2)}</span>
            </div>

            <div className="bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]">
              <div className="flex justify-between items-center">
                <span className="text-xl font-black uppercase">Grand Total:</span>
                <span className="text-3xl font-black text-orange-400">Rs. {grandTotalAll.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex justify-center gap-4 no-print border-t-2 border-black pt-6">
           <button onClick={() => window.location.href='/admin/settings'} className="border-2 border-black px-6 py-3 font-black text-xs uppercase hover:bg-zinc-100 transition-all flex items-center gap-2">⚙️ Control Center</button>
           <button onClick={() => window.print()} className="bg-zinc-900 text-white px-10 py-3 font-black text-xs uppercase shadow-xl hover:bg-black">🖨️ Print Daily Summary</button>
        </div>

      </div>
    </div>
  );
}