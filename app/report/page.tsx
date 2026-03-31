// app/report/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore'; 
import { db } from '../firebase';

// Types - මේවා නිසා කෝඩ් එකේ වැරදි සිදුවීම වළකිනවා
type OrderItem = { name?: string; qty?: number; price?: number };
type FirestoreTimestamp = { toDate: () => Date };
type Order = {
  id?: string;
  orderID?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  subTotal?: number;
  totalAmount?: number;
  deliveryFee?: number;
  status?: string;
  paymentMethod?: string;
  items?: OrderItem[];
  createdAt?: FirestoreTimestamp | any;
};
type MenuCosts = Record<string, { cost?: number }>;

export default function DailyReport() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuCosts, setMenuCosts] = useState<MenuCosts>({});
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
      if (snap.exists()) setMenuCosts(snap.data() as MenuCosts);
    });

    // 2. Orders Real-time Listener
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
    const unsubOrders = onSnapshot(q, (snapshot) => {
      const today = new Date().toLocaleDateString();
      const todayOrders: Order[] = [];
      snapshot.forEach((orderDoc) => {
        const data = orderDoc.data() as Order;
        const orderDate = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : '';
        if (orderDate === today) todayOrders.push({ id: orderDoc.id, ...data });
      });
      setOrders(todayOrders);
      setLoading(false);
    });

    return () => { unsubSettings(); unsubOrders(); };
  }, []);

  // --- Profit Calculation Logic ---
  const breakdown = orders.reduce((acc, order) => {
    acc.totalDelivery += Number(order.deliveryFee ?? 0);
    (order.items ?? []).forEach((item: OrderItem) => {
      const rawName = String(item.name ?? '');
      const cleanName = rawName.replace(/^\d+\s*x\s*/i, '');
      const baseName = cleanName.split(' ')[0].split('(')[0].trim().toLowerCase();
      
      const menuKey = Object.keys(menuCosts).find(k => k.toLowerCase().includes(baseName)) || baseName;
      const unitCost = Number(menuCosts[menuKey]?.cost ?? 0);
      const unitPrice = Number(item.price ?? 0);
      
      const profit = (unitPrice - unitCost) * Number(item.qty ?? 1);
      const displayName = baseName ? baseName.toUpperCase() : 'UNKNOWN';
      
      acc.itemProfits[displayName] = (acc.itemProfits[displayName] || 0) + profit;
    });
    return acc;
  }, { totalDelivery: 0, itemProfits: {} as Record<string, number> });

  const grandTotalAll = orders.reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0);
  const totalNetProfit = Object.values(breakdown.itemProfits).reduce((a: number, b: number) => a + Number(b ?? 0), 0);

  const handleHandover = async (id: string) => { 
    if (id) await updateDoc(doc(db, "orders", id), { status: "Handovered" }); 
  };

  // --- Professional Print Function ---
  const printSlip = (order: Order, type: 'KITCHEN' | 'CUSTOMER') => {
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
            <p style="font-size:12px">ID: ${order.orderID ?? 'N/A'}<br>Date: ${new Date().toLocaleDateString()}</p>
            ${type === 'CUSTOMER' ? `<p style="font-size:13px"><b>To:</b> ${order.customerName ?? 'Unknown'}<br><b>Tel:</b> ${order.phone ?? '-'}</p>` : ''}
            <div style="border-top:1px solid #000; padding-top:10px;">
              ${(order.items ?? []).map((it: OrderItem) => `
                <div class="item-row">
                  <span>${it.name ?? 'Item'}</span>
                  <span>x${it.qty ?? 1}</span>
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
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center w-full max-w-sm shadow-2xl">
          <h2 className="text-xl font-black mb-6 uppercase text-zinc-400 tracking-widest italic underline decoration-orange-600">Week Out Admin</h2>
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
          <h2 className="text-xs font-bold text-gray-500 tracking-[0.3em] uppercase">Owner&apos;s Dashboard</h2>
        </div>

        <div className="overflow-x-auto mb-10 border-2 border-black">
          <table className="w-full border-collapse">
            <thead className="bg-zinc-100 text-[11px] uppercase font-black">
              <tr className="border-b-2 border-black">
                <th className="p-3 border-r-2 border-black">Order ID</th>
                <th className="p-3 border-r-2 border-black text-left">Customer & Items</th>
                <th className="p-3 border-r-2 border-black text-right">Amount</th>
                <th className="p-3 border-r-2 border-black text-right">Total</th>
                <th className="p-3 no-print">Manage</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id || `order-${index}`} className={`border-b-2 border-black transition-colors ${order.status === 'Handovered' ? 'bg-green-50' : 'hover:bg-zinc-50'}`}>
                  <td className="p-2 border-r-2 border-black font-mono text-[10px] font-bold text-center">{order.orderID ?? '—'}</td>
                  <td className="p-2 border-r-2 border-black text-sm uppercase">
                    <div className="font-black text-blue-700 text-xs mb-1">{order.customerName}</div>
                    {order.items?.map((it: OrderItem, i: number) => <div key={i} className="text-[10px] leading-tight">• {it.name}</div>)}
                  </td>
                  <td className="p-2 border-r-2 border-black text-right font-mono text-xs">{Number(order.subTotal ?? 0).toFixed(2)}</td>
                  <td className="p-2 border-r-2 border-black text-right font-black bg-zinc-50">{Number(order.totalAmount ?? 0).toFixed(2)}</td>
                  <td className="p-2 no-print">
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1">
                        <button onClick={() => printSlip(order, 'KITCHEN')} className="flex-1 bg-zinc-800 text-white text-[9px] py-1 rounded font-black">CHEF</button>
                        <button onClick={() => printSlip(order, 'CUSTOMER')} className="flex-1 bg-blue-600 text-white text-[9px] py-1 rounded font-black">BILL</button>
                      </div>
                      {order.status !== 'Handovered' ? (
                        <button onClick={() => order.id && handleHandover(order.id)} className="w-full bg-orange-600 text-white text-[9px] py-1.5 rounded font-black uppercase">Handover</button>
                      ) : (
                        <div className="text-center text-green-600 font-black text-[9px] border border-green-200 bg-white p-1 rounded">DONE ✅</div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 w-full border-4 border-black p-5 relative bg-zinc-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="absolute -top-4 left-4 bg-yellow-400 px-3 py-1 font-black text-xs border-2 border-black uppercase">Profit Breakdown</h3>
            <div className="mt-3 space-y-2">
              {Object.entries(breakdown.itemProfits).map(([name, profit]: [string, number]) => (
                <div key={name} className="flex justify-between items-center border-b-2 border-dashed border-zinc-200 pb-1">
                  <span className="font-bold text-xs text-zinc-600 tracking-wider">{name}</span>
                  <span className="font-black text-green-700 text-sm">Rs. {Number(profit).toFixed(2)}</span>
                </div>
              ))}
              {Object.keys(breakdown.itemProfits).length === 0 && <div className="text-xs italic text-gray-400 py-4 text-center">No data found</div>}
            </div>
          </div>

          <div className="w-full md:w-[400px] space-y-4">
            <div className="border-4 border-black p-4 flex justify-between items-center bg-blue-50 shadow-[5px_5px_0px_0px_rgba(30,64,175,1)]">
               <span className="font-black text-xs uppercase">Delivery Income:</span>
               <span className="text-xl font-black text-blue-800">Rs. {breakdown.totalDelivery.toFixed(2)}</span>
            </div>
            <div className="border-4 border-black p-4 flex justify-between items-center bg-green-50 shadow-[5px_5px_0px_0px_rgba(21,128,61,1)]">
               <span className="font-black text-xs uppercase text-green-900">Total Net Profit:</span>
               <span className="text-2xl font-black text-green-700">Rs. {totalNetProfit.toFixed(2)}</span>
            </div>
            <div className="bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] border-4 border-white outline outline-4 outline-black">
              <div className="flex justify-between items-center">
                <span className="text-xl font-black uppercase italic">Grand Total:</span>
                <span className="text-3xl font-black text-orange-400 font-mono">Rs. {grandTotalAll.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-6 no-print border-t-4 border-black pt-8">
           <button onClick={() => window.location.href='/admin/settings'} className="bg-white border-4 border-black px-8 py-4 font-black text-xs uppercase hover:bg-zinc-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">⚙️ Settings</button>
           <button onClick={() => window.print()} className="bg-zinc-900 text-white border-4 border-black px-10 py-4 font-black text-xs uppercase hover:bg-black transition-all shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]">🖨️ Print Report</button>
        </div>
      </div>
    </div>
  );
}