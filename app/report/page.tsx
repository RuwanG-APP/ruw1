// app/report/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore'; 
import { db } from '../firebase';
import { getBaseName } from '../lib/pricing';

export default function DailyReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [menuCosts, setMenuCosts] = useState<any>({});
  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'menu'), (snap) => {
      if (snap.exists()) setMenuCosts(snap.data());
    });
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
    const unsubOrders = onSnapshot(q, (snapshot) => {
      const today = new Date().toLocaleDateString();
      const todayOrders: any[] = [];
      snapshot.forEach((orderDoc) => {
        const data = orderDoc.data();
        const orderDate = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : '';
        if (orderDate === today) todayOrders.push({ id: orderDoc.id, ...data });
      });
      setOrders(todayOrders);
    });
    return () => { unsubSettings(); unsubOrders(); };
  }, []);

  const breakdown = orders.reduce((acc, order) => {
    acc.totalDelivery += Number(order.deliveryFee ?? 0);
    order.items?.forEach((item: any) => {
      const baseName = getBaseName(item.name);
      const menuKey = Object.keys(menuCosts).find(k => k.toUpperCase().includes(baseName)) || baseName;
      
      // ප්‍රමුඛතාවය: ඕඩර් එකේ ලොක් වුණු කොස්ට් එක, නැත්නම් දැන් සෙටින්ග්ස් වල තියෙන එක
      const unitCost = Number(item.costPrice ?? menuCosts[menuKey]?.cost ?? 0);
      const profit = Number(item.price) - (unitCost * Number(item.qty || 1));
      
      acc.itemProfits[baseName] = (acc.itemProfits[baseName] || 0) + profit;
    });
    return acc;
  }, { totalDelivery: 0, itemProfits: {} as any });

  const grandTotalAll = orders.reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0);
  const totalNetProfit = Object.values(breakdown.itemProfits).reduce((a: any, b: any) => a + b, 0);

  const printSlip = (order: any, type: string) => {
    const win = window.open('', '_blank');
    const content = `<html><body onload="window.print();window.close()"><div style="border:1px solid #000;padding:20px;max-width:300px;text-align:center;"><h2>WEEK OUT</h2><p>${type}</p><hr>${order.items.map((i:any)=>`<p>${i.name} x ${i.qty}</p>`).join('')}<hr><h3>TOTAL: Rs.${order.totalAmount}</h3><p style="color:orange;font-weight:bold;">Thank you! Order Again!</p></div></body></html>`;
    win?.document.write(content); win?.document.close();
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <input type="password" onKeyDown={(e)=> (e.target as any).value === 'ruwan123' && setIsAuth(true)} placeholder="PIN" className="p-4 rounded-xl text-center outline-none" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 font-sans text-black">
      <div className="max-w-6xl mx-auto border-4 border-black p-6 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black text-center mb-8 uppercase tracking-tighter italic">Week Out - Online Foods</h1>
        
        {/* Table */}
        <div className="overflow-x-auto mb-10 border-2 border-black">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-white font-black uppercase">
              <tr><th className="p-3">ID</th><th className="p-3 text-left">Customer & Items</th><th className="p-3 text-right">Total</th><th className="p-3">Manage</th></tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} className="border-b-2 border-black">
                  <td className="p-2 font-mono font-bold text-center">{o.orderID}</td>
                  <td className="p-2 uppercase"><b className="text-blue-700 underline">{o.customerName}</b><br/>{o.items.map((it:any)=>it.name).join(', ')}</td>
                  <td className="p-2 text-right font-black">Rs. {o.totalAmount}.00</td>
                  <td className="p-2 flex gap-1">
                    <button onClick={()=>printSlip(o, 'CHEF')} className="bg-black text-white px-2 py-1 rounded text-[10px] font-bold">CHEF</button>
                    <button onClick={()=>printSlip(o, 'BILL')} className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold">BILL</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Analytics Breakdown */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 border-4 border-black p-5 bg-zinc-50 relative">
            <h3 className="absolute -top-4 left-4 bg-yellow-400 px-3 py-1 font-black text-xs border-2 border-black uppercase italic">Profit Breakdown (Locked)</h3>
            {Object.entries(breakdown.itemProfits).map(([name, profit]: any) => (
              <div key={name} className="flex justify-between border-b border-dashed border-zinc-300 py-1 font-bold uppercase text-xs">
                <span>{name}</span><span className="text-green-700">Rs. {profit.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="w-full md:w-[350px] space-y-3">
             <div className="border-4 border-black p-4 bg-blue-50 font-black flex justify-between uppercase"><span>Delivery:</span><span>Rs. {breakdown.totalDelivery.toFixed(2)}</span></div>
             <div className="border-4 border-black p-4 bg-green-50 font-black flex justify-between uppercase"><span>Total Profit:</span><span className="text-green-700">Rs. {totalNetProfit.toFixed(2)}</span></div>
             <div className="bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] border-2 border-white flex justify-between font-black uppercase italic">
                <span className="text-xl underline decoration-orange-500">Grand Total:</span>
                <span className="text-3xl text-orange-400">Rs. {grandTotalAll.toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}