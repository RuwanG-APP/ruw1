// app/report/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore'; 
import { db } from '../firebase';

export default function DailyReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [menuCosts, setMenuCosts] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  // 1. Password Security
  const checkPass = () => {
    if (pass === 'ruwan123') setIsAuth(true);
    else alert('වැරදි මුරපදයක්!');
  };

  useEffect(() => {
    // 2. Fetch Menu Costs from Control Center
    async function fetchCosts() {
      const snap = await getDoc(doc(db, 'settings', 'menu'));
      if (snap.exists()) setMenuCosts(snap.data());
    }
    fetchCosts();

    // 3. Real-time Listener (A-Z Order)
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    return () => unsubscribe();
  }, []);

  // --- Print Function (දැන් මේක සම්පූර්ණයෙන්ම වැඩ!) ---
  const printSlip = (order: any, type: 'KITCHEN' | 'CUSTOMER') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>${type} SLIP - ${order.orderID}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #000; }
            .bill-box { max-width: 350px; margin: auto; border: 1px solid #000; padding: 15px; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .info { font-size: 13px; line-height: 1.5; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; }
            th { border-bottom: 1px solid #000; text-align: left; font-size: 13px; }
            td { padding: 5px 0; font-size: 13px; }
            .totals { border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px; }
            .grand { background: #000; color: #fff; padding: 5px; font-weight: bold; margin-top: 5px; display: flex; justify-content: space-between; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="bill-box">
            <div class="header">
              <h2 style="margin:0">WEEK OUT</h2>
              <p style="margin:0; font-size:12px;">${type === 'KITCHEN' ? 'KITCHEN COPY' : 'OFFICIAL INVOICE'}</p>
              <small>ID: ${order.orderID} | ${new Date().toLocaleDateString()}</small>
            </div>
            ${type === 'CUSTOMER' ? `
              <div class="info">
                <b>NAME:</b> ${order.customerName}<br>
                <b>PHONE:</b> ${order.phone}<br>
                <b>ADDR:</b> ${order.address}
              </div>
            ` : ''}
            <table>
              <thead><tr><th>ITEM</th><th>QTY</th>${type === 'CUSTOMER' ? '<th style="text-align:right">PRICE</th>' : ''}</tr></thead>
              <tbody>
                ${order.items.map((it: any) => `
                  <tr>
                    <td>${it.name}<br><small>${it.details}</small></td>
                    <td style="text-align:center">${it.qty || 1}</td>
                    ${type === 'CUSTOMER' ? `<td style="text-align:right">${it.price}.00</td>` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${type === 'CUSTOMER' ? `
              <div class="totals">
                <div style="display:flex; justify-content:space-between"><span>Subtotal:</span><span>Rs. ${order.subTotal}.00</span></div>
                <div style="display:flex; justify-content:space-between"><span>Delivery:</span><span>Rs. ${order.deliveryFee}.00</span></div>
                <div class="grand"><span>NET TOTAL:</span><span>Rs. ${order.totalAmount}.00</span></div>
              </div>
              <div class="footer">
                <p style="color:#d35400">Thank you! Order Again and get 3-10% Discount!!</p>
                <p>HOT LINE: 0760829235</p>
              </div>
            ` : '<p style="text-align:center; margin-top:20px;">--- START COOKING ---</p>'}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleHandover = async (id: string) => { await updateDoc(doc(db, "orders", id), { status: "Handovered" }); };

  // Calculations
  const grandTotalAll = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const estimatedProfit = orders.reduce((sum, order) => {
    const orderCost = order.items?.reduce((oSum: number, item: any) => {
      const itemName = item.name.toLowerCase().replace(' ', '-');
      const unitCost = menuCosts[itemName]?.cost || 0;
      return oSum + (unitCost * (item.qty || 1));
    }, 0);
    return sum + ((order.totalAmount - order.deliveryFee) - (orderCost || 0));
  }, 0);

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 font-sans">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center w-full max-w-sm">
          <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-zinc-400">Week Out Admin</h2>
          <input type="password" onChange={(e)=>setPass(e.target.value)} placeholder="ENTER PIN" className="w-full bg-white text-black p-4 rounded-xl text-center mb-4 font-bold text-lg outline-none" />
          <button onClick={checkPass} className="w-full bg-orange-600 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all">Unlock System</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-black">
      <div className="max-w-7xl mx-auto border-2 border-black p-6">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black uppercase">Week Out - Online Foods</h1>
          <h2 className="text-sm font-bold text-gray-500 uppercase">Live Control Center</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black">
            <thead className="bg-zinc-100 text-[11px] uppercase font-black">
              <tr>
                <th className="border-2 border-black p-2">Order ID</th>
                <th className="border-2 border-black p-2 text-left">Item Details</th>
                <th className="border-2 border-black p-2">Qty</th>
                <th className="border-2 border-black p-2 text-right">Amount</th>
                <th className="border-2 border-black p-2">CoD</th>
                <th className="border-2 border-black p-2 text-center">Bank</th>
                <th className="border-2 border-black p-2 text-right">Total</th>
                <th className="border-2 border-black p-2 no-print">Manage</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className={`border-b border-black/10 ${order.status === 'Handovered' ? 'bg-green-50' : ''}`}>
                  <td className="border-r border-black p-2 font-mono text-[10px] font-bold">{order.orderID}</td>
                  <td className="border-r border-black p-2 text-sm">
                    <div className="font-black text-blue-700 text-xs mb-1">{order.customerName}</div>
                    {order.items?.map((it:any, i:number) => <div key={i} className="text-[11px] leading-tight">• {it.name} <small>(${it.details})</small></div>)}
                  </td>
                  <td className="border-r border-black p-2 text-center font-bold">{order.items?.reduce((s:number, i:any)=> s + (i.qty||1), 0)}</td>
                  <td className="border-r border-black p-2 text-right font-mono">{order.subTotal?.toFixed(2)}</td>
                  <td className="border-r border-black p-2 text-center font-bold">{order.paymentMethod === 'COD' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-center text-blue-600 font-bold">{order.paymentMethod === 'Online' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-right font-black bg-zinc-50">{order.totalAmount?.toFixed(2)}</td>
                  <td className="p-2 no-print">
                    <div className="flex gap-1 mb-1">
                      <button onClick={() => printSlip(order, 'KITCHEN')} className="flex-1 bg-zinc-800 text-white text-[10px] p-2 rounded font-bold hover:bg-black transition-all">CHEF</button>
                      <button onClick={() => printSlip(order, 'CUSTOMER')} className="flex-1 bg-blue-600 text-white text-[10px] p-2 rounded font-bold hover:bg-blue-700 transition-all">BILL</button>
                    </div>
                    {order.status !== 'Handovered' ? (
                      <button onClick={() => handleHandover(order.id)} className="w-full bg-orange-600 text-white text-[10px] p-2 rounded font-black uppercase shadow-sm">Handover</button>
                    ) : (
                      <div className="text-center text-green-600 font-black text-[9px] border border-green-200 bg-white p-1 rounded">COMPLETED ✅</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col items-end gap-2">
          <div className="border border-dashed border-zinc-400 p-3 min-w-[280px] text-right">
             <span className="text-zinc-500 font-bold uppercase text-[10px]">Estimated Daily Profit:</span>
             <span className="text-xl font-black text-green-600 ml-4">Rs. {estimatedProfit.toFixed(2)}</span>
          </div>
          <div className="bg-black text-white p-5 min-w-[320px] shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]">
            <div className="flex justify-between items-center">
              <span className="text-lg font-black uppercase">Grand Total:</span>
              <span className="text-3xl font-black">Rs. {grandTotalAll.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center gap-4 no-print">
           <button onClick={() => window.location.href='/admin/settings'} className="bg-zinc-100 text-zinc-900 border-2 border-black px-6 py-3 font-black uppercase text-xs hover:bg-zinc-200 transition-all">Business Settings</button>
           <button onClick={() => window.print()} className="bg-zinc-900 text-white px-8 py-3 font-black uppercase text-xs hover:bg-black transition-all shadow-xl">🖨️ Print Full Report</button>
        </div>
      </div>
    </div>
  );
}