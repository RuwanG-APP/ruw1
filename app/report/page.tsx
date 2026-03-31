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
    // 1. Settings (Costs) Real-time Listener
    const unsubSettings = onSnapshot(doc(db, 'settings', 'menu'), (snap) => {
      if (snap.exists()) setMenuCosts(snap.data());
    });

    // 2. Orders Real-time Listener
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

  // --- Profit Calculation Logic ---
  const breakdown = orders.reduce((acc, order) => {
    acc.totalDelivery += Number(order.deliveryFee || 0);
    order.items?.forEach((item: any) => {
      const cleanName = item.name.replace(/^\d+\s*x\s*/i, ''); 
      const baseName = cleanName.split(' ')[0].split('(')[0].trim().toLowerCase();
      const menuKey = Object.keys(menuCosts).find(k => k.includes(baseName)) || baseName;
      const unitCost = Number(menuCosts[menuKey]?.cost || 0);
      const unitPrice = Number(item.price || 0);
      const profit = (unitPrice - unitCost) * Number(item.qty || 1);
      const displayName = baseName.toUpperCase();
      acc.itemProfits[displayName] = (acc.itemProfits[displayName] || 0) + profit;
    });
    return acc;
  }, { totalDelivery: 0, itemProfits: {} as any });

  const grandTotalAll = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const totalNetProfit = Object.values(breakdown.itemProfits).reduce((a: any, b: any) => a + Number(b), 0);

  const handleHandover = async (id: string) => { 
    await updateDoc(doc(db, "orders", id), { status: "Handovered" }); 
  };

  // --- Professional Print Function ---
  const printSlip = (order: any, type: 'KITCHEN' | 'CUSTOMER') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .bill { max-width: 300px; margin: auto; border: 2px solid #000; padding: 15px; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .item-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 14px; }
            .total-box { background: #000; color: #fff; padding: 8px; margin-top: 15px; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; margin-top: 15px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="bill">
            <div class="header">
              <h2 style="margin:0">WEEK OUT</h2>
              <p style="margin:5px 0">${type === 'KITCHEN' ? 'KITCHEN ORDER' : 'INVOICE'}</p>
            </div>
            <p style="font-size:12px">ID: ${order.orderID}<br>Date: ${new Date().toLocaleDateString()}</p>
            ${type === 'CUSTOMER' ? `<p style="font-size:13px"><b>To:</b> ${order.customerName}<br><b>Tel:</b> ${order.phone}</p>` : ''}
            <div style="border-top:1px solid #000; padding-top:10px;">
              ${order.items.map((it: any) => `
                <div class="item-row">
                  <span>${it.name}</span>
                  <span>x${it.qty || 1}</span>
                </div>
              `).join('')}
            </div>
            ${type === 'CUSTOMER' ? `
              <div class="total-box">
                <div style="display:flex; justify-content:space-between"><span>NET TOTAL:</span><span>Rs. ${order.totalAmount}.00</span></div>
              </div>
              <div class="footer">Thank you! Order Again!</div>
            ` : ''}
          </div>
        </body>
      </html>`;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center w-full max-w-sm">
          <h2 className="text-xl font-black mb-6 uppercase text-zinc-400 tracking-widest">Week Out Admin</h2>
          <input type="password" autoFocus onChange={(e)=>setPass(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&checkPass()} placeholder="ENTER PIN" className="w-full bg-white text-black p-4 rounded-xl text-center mb-4 font-bold text-lg outline-none" />
          <button onClick={checkPass} className="w-full bg-orange-600 py-4 rounded-xl font-black uppercase text-white shadow-lg active:scale-95 transition-all">Unlock System</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 text-black font-sans">
      <div className="max-w-7xl mx-auto border-2 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="text-center border-b-2 border-black pb-4 mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Week Out - Online Foods</h1>
          <h2 className="text-xs font-bold text-gray-500 tracking-[0.3em] uppercase">Owner's Dashboard</h2>
        </div>

        <div className="overflow-x-auto mb-10 border-2 border-black">
          <table className="w-full">
            <thead className="bg-zinc-100 text-[11px] uppercase font-black">
              <tr className="border-b-2 border-black">
                <th className="p-2 border-r-2 border-black">Order ID</th>
                <th className="p-2 border-r-2 border-black text-left">Customer & Items</th>
                <th className="p-2 border-r-2 border-black text-right">Amount</th>
                <th className="p-2 border-r-2 border-black text-right">Total</th>
                <th className="p-2 no-print">Manage</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className={`border-b-2 border-black ${order.status === 'Handovered' ? 'bg-green-50' : ''}`}>
                  <td className="p-2 border-r-2 border-black font-mono text-[10px] font-bold text-center">{order.orderID}</td>
                  <td className="p-2 border-r-2 border-black text-sm uppercase">
                    <div className="font-black text-blue-700 text-xs mb-1">{order.customerName}</div>
                    {order.items?.map((it:any, i:number) => <div key={i} className="text-[10px] leading-tight">• {it.name}</div>)}
                  </td>
                  <td className="p-2 border-r-2 border-black text-right font-mono text-xs">{Number(order.subTotal).toFixed(2)}</td>
                  <td className="p-2 border-r-2 border-black text-right font-black bg-zinc-50">{Number(order.totalAmount).toFixed(2)}</td>
                  <td className="p-2 no-print flex gap-1 items-center">
                    <button onClick={() => printSlip(order, 'KITCHEN')} className="bg-zinc-800 text-white text-[9px] px-2 py-1.5 rounded font-black">CHEF</button>
                    <button onClick={() => printSlip(order, 'CUSTOMER')} className="bg-blue-600 text-white text-[9px] px-2 py-1.5 rounded font-black">BILL</button>
                    {order.status !== 'Handovered' ? (
                      <button onClick={() => handleHandover(order.id)} className="bg-orange-600 text-white text-[9px] px-2 py-1.5 rounded font-black">DONE</button>
                    ) : (
                      <span className="text-green-600 font-black text-[10px] ml-1">✅</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 w-full border-2 border-black p-5 relative bg-zinc-50">
            <h3 className="absolute -top-3 left-4 bg-yellow-400 px-2 font-black text-[10px] border-2 border-black uppercase">Profit Breakdown</h3>
            <div className="mt-2 space-y-2">
              {Object.entries(breakdown.itemProfits).map(([name, profit]: any) => (
                <div key={name} className="flex justify-between items-center border-b border-dashed border-zinc-300 pb-1">
                  <span className="font-bold text-xs text-zinc-600">{name}</span>
                  <span className="font-black text-green-700">Rs. {Number(profit).toFixed(2)}</span>
                </div>
              ))}
              {Object.keys(breakdown.itemProfits).length === 0 && <div className="text-xs italic text-gray-400">No data to display</div>}
            </div>
          </div>
          <div className="w-full md:w-[400px] space-y-4">
            <div className="border-2 border-black p-4 flex justify-between items-center bg-blue-50">
               <span className="font-black text-[10px] uppercase text-blue-900">Delivery Income:</span>
               <span className="text-xl font-black text-blue-800">Rs. {breakdown.totalDelivery.toFixed(2)}</span>
            </div>
            <div className="border-2 border-black p-4 flex justify-between items-center bg-green-50 shadow-[4px_4px_0px_0px_rgba(21,128,61,1)]">
               <span className="font-black text-[10px] uppercase text-green-900">Total Net Profit:</span>
               <span className="text-2xl font-black text-green-700">Rs. {totalNetProfit.toFixed(2)}</span>
            </div>
            <div className="bg-black text-white p-5 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] border-2 border-black">
              <div className="flex justify-between items-center">
                <span className="text-xl font-black uppercase tracking-tighter">Grand Total:</span>
                <span className="text-3xl font-black text-orange-400 font-mono">Rs. {grandTotalAll.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center gap-4 no-print border-t-2 border-black pt-6">
           <button onClick={() => window.location.href='/admin/settings'} className="border-2 border-black px-6 py-3 font-black text-[10px] uppercase hover:bg-zinc-100 transition-all flex items-center gap-2">⚙️ Settings</button>
           <button onClick={() => window.print()} className="bg-zinc-900 text-white border-2 border-black px-8 py-3 font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl">🖨️ Print Report</button>
        </div>
      </div>
    </div>
  );
}