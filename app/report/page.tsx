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
    const content = `<html><body onload="window.print();window.close()"><div style="border:2px solid #000;padding:20px;max-width:300px;text-align:center;font-family:sans-serif;"><h2>WEEK OUT</h2><p>${type}</p><hr>${order.items.map((i:any)=>`<p>${i.name} x ${i.qty}</p>`).join('')}<hr><h3>TOTAL: Rs.${order.totalAmount}</h3><p style="color:orange;font-weight:bold;">Thank you! Order Again!</p></div></body></html>`;
    win?.document.write(content); win?.document.close();
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <input 
          type="password" 
          autoFocus 
          onKeyDown={(e)=> (e.target as any).value === 'ruwan123' && e.key === 'Enter' && setIsAuth(true)} 
          placeholder="ADMIN PIN" 
          className="p-4 rounded-2xl text-center outline-none font-black text-lg" 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-black">
      <div className="max-w-7xl mx-auto border-4 border-black p-6 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center border-b-4 border-black pb-4 mb-8">
            <h1 className="text-5xl font-black uppercase tracking-tighter italic">Week Out - Dashboard</h1>
        </div>
        
        {/* Orders Table */}
        <div className="overflow-x-auto mb-10 border-4 border-black">
          <table className="w-full text-sm">
            <thead className="bg-black text-white font-black uppercase">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4 text-left">Customer & Items</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4">Manage</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} className="border-b-4 border-black hover:bg-zinc-50">
                  <td className="p-3 font-mono font-bold text-center border-r-2 border-black">{o.orderID}</td>
                  <td className="p-3 uppercase border-r-2 border-black">
                    <b className="text-blue-700 underline block mb-1">{o.customerName}</b>
                    <div className="text-[10px] text-zinc-500 font-bold">
                      {o.items.map((it:any)=>`${it.qty}x ${it.name}`).join(', ')}
                    </div>
                  </td>
                  <td className="p-3 text-right font-black bg-zinc-50 border-r-2 border-black text-lg text-black">
                    Rs. {o.totalAmount}.00
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-center">
                        <button onClick={()=>printSlip(o, 'CHEF')} className="bg-zinc-800 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase">Chef</button>
                        <button onClick={()=>printSlip(o, 'BILL')} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase">Bill</button>
                        {o.status !== 'Handovered' && (
                          <button onClick={()=>updateDoc(doc(db,"orders",o.id), {status:"Handovered"})} className="bg-orange-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase">Done</button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-4 border-black p-6 bg-zinc-50 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="absolute -top-5 left-6 bg-yellow-400 px-4 py-1 font-black text-xs border-4 border-black uppercase italic">Itemized Profit</h3>
            <div className="space-y-3 mt-4">
                {Object.entries(breakdown.itemProfits).map(([name, profit]: any) => (
                  <div key={name} className="flex justify-between border-b-2 border-dashed border-zinc-200 pb-1 font-black uppercase text-xs">
                      <span className="text-zinc-500">{name}</span>
                      <span className="text-green-700">Rs. {profit.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-4">
             <div className="border-4 border-black p-5 bg-blue-50 font-black flex justify-between uppercase italic shadow-[8px_8px_0px_0px_rgba(30,64,175,1)]">
               <span>Delivery:</span>
               <span className="text-blue-800 text-black">Rs. {breakdown.totalDelivery.toFixed(2)}</span>
             </div>
             <div className="border-4 border-black p-5 bg-green-50 font-black flex justify-between uppercase italic shadow-[8px_8px_0px_0px_rgba(21,128,61,1)]">
               <span>Total Profit:</span>
               <span className="text-green-700">Rs. {totalNetProfit.toFixed(2)}</span>
             </div>
             <div className="bg-black text-white p-8 shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] border-4 border-white outline outline-4 outline-black flex justify-between font-black uppercase italic">
                <span className="text-2xl underline decoration-orange-500 underline-offset-8">Grand Total:</span>
                <span className="text-5xl text-orange-400">Rs. {grandTotalAll.toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}