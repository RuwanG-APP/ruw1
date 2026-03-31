// app/report/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore'; 
import { db } from '../firebase';

export default function DailyReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  const checkPass = () => {
    if (pass === 'ruwan123') setIsAuth(true);
    else alert('Wrong Password!');
  };

  useEffect(() => {
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

  const handleHandover = async (id: string) => {
    await updateDoc(doc(db, "orders", id), { status: "Handovered" });
  };

  const handlePostpone = async (order: any) => {
    const now = new Date();
    const isLate = now.getHours() > 14 || (now.getHours() === 14 && now.getMinutes() > 30);
    if (isLate) {
      alert("Cannot postpone after 2:30 PM!");
      return;
    }
    if (window.confirm('Postpone this order?')) {
      await updateDoc(doc(db, "orders", order.id), { status: "Postponed" });
    }
  };

  // --- පර්ෆෙක්ට් බිල් එක මෙන්න මෙතනින් ---
  const printSlip = (order: any, type: 'KITCHEN' | 'CUSTOMER') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>${type} SLIP - ${order.orderID}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #000; }
            .bill-container { max-width: 400px; margin: auto; border: 1px solid #eee; padding: 20px; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .header h2 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .header p { margin: 5px 0; font-size: 14px; font-weight: bold; }
            
            .cust-info { text-align: left; font-size: 14px; margin-bottom: 15px; line-height: 1.6; }
            .cust-info b { display: inline-block; width: 80px; }

            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { border-bottom: 1px solid #000; text-align: left; padding: 8px 0; font-size: 14px; }
            td { padding: 8px 0; font-size: 14px; vertical-align: top; }
            
            .total-section { border-top: 2px dashed #000; margin-top: 15px; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 15px; }
            .grand-total { display: flex; justify-content: space-between; margin-top: 10px; padding: 8px; background: #000; color: #fff; font-weight: bold; font-size: 18px; }
            
            .footer { margin-top: 25px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
            .promo { font-weight: bold; color: #d35400; font-size: 14px; margin-bottom: 10px; }
            .contact { font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="bill-container">
            <div class="header">
              <h2>WEEK OUT</h2>
              <p>${type === 'KITCHEN' ? 'KITCHEN ORDER' : 'OFFICIAL INVOICE'}</p>
              <span style="font-size: 12px;">ID: ${order.orderID} | ${new Date().toLocaleDateString()}</span>
            </div>

            ${type === 'CUSTOMER' ? `
              <div class="cust-info">
                <div><b>NAME:</b> ${order.customerName}</div>
                <div><b>PHONE:</b> ${order.phone}</div>
                <div><b>ADDR:</b> ${order.address}</div>
              </div>
            ` : ''}

            <table>
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th style="text-align: center;">QTY</th>
                  ${type === 'CUSTOMER' ? '<th style="text-align: right;">PRICE</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${order.items.map((it: any) => `
                  <tr>
                    <td>${it.name}<br><small style="color:#666">${it.details}</small></td>
                    <td style="text-align: center;">${it.qty || 1}</td>
                    ${type === 'CUSTOMER' ? `<td style="text-align: right;">${it.price}.00</td>` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${type === 'CUSTOMER' ? `
              <div class="total-section">
                <div class="total-row"><span>Subtotal:</span><span>Rs. ${order.subTotal}.00</span></div>
                <div class="total-row"><span>Delivery:</span><span>Rs. ${order.deliveryFee}.00</span></div>
                <div class="grand-total"><span>NET TOTAL:</span><span>Rs. ${order.totalAmount}.00</span></div>
              </div>
              
              <div class="footer">
                <div class="promo">Thank you! Order Again and get 3-10% Discount!!</div>
                <div class="contact">ORDER VIA APP OR HOT LINE<br>📞 0760829235</div>
              </div>
            ` : `
              <div style="margin-top:20px; border-top:1px solid #000; padding-top:10px; font-weight:bold;">
                --- START PREPARING ---
              </div>
            `}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Week Out Admin</h2>
        <input type="password" onChange={(e)=>setPass(e.target.value)} placeholder="Enter Pin" className="text-black p-4 rounded-xl text-center mb-4 focus:ring-2 focus:ring-orange-500 outline-none" />
        <button onClick={checkPass} className="bg-orange-600 hover:bg-orange-700 px-10 py-3 rounded-xl font-bold transition-all">UNLOCK SYSTEM</button>
      </div>
    );
  }

  const grandTotalAll = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-black">
      <div className="max-w-7xl mx-auto border-2 border-black p-6">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Week Out - Online Foods</h1>
          <h2 className="text-xl font-bold mt-1 uppercase text-gray-500">Live Order Control Center</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="border-2 border-black p-2">Order ID</th>
                <th className="border-2 border-black p-2 text-left">Item Details</th>
                <th className="border-2 border-black p-2">Qty</th>
                <th className="border-2 border-black p-2 text-right">Amart</th>
                <th className="border-2 border-black p-2">CoD</th>
                <th className="border-2 border-black p-2 text-center">Bank</th>
                <th className="border-2 border-black p-2 text-right">Total</th>
                <th className="border-2 border-black p-2 no-print">Manage</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className={`border-b border-black/10 ${order.status === 'Handovered' ? 'bg-green-50' : ''}`}>
                  <td className="border-r border-black p-2 font-mono text-xs font-bold">{order.orderID}</td>
                  <td className="border-r border-black p-2 text-sm">
                    <div className="font-bold text-blue-800">{order.customerName}</div>
                    {order.items?.map((it:any, i:number) => <div key={i} className="text-xs">• {it.name} <small>({it.details})</small></div>)}
                    {order.status === 'Postponed' && <div className="text-red-600 font-bold text-[10px] mt-1 italic">⚠️ POSTPONED (CREDIT)</div>}
                  </td>
                  <td className="border-r border-black p-2 text-center font-bold">{order.items?.reduce((s:number, i:any)=> s + (i.qty||1), 0)}</td>
                  <td className="border-r border-black p-2 text-right">{order.subTotal?.toFixed(2)}</td>
                  <td className="border-r border-black p-2 text-center font-bold">{order.paymentMethod === 'COD' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-center font-bold text-blue-600">{order.paymentMethod === 'Online' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-right font-black bg-gray-50">{order.totalAmount?.toFixed(2)}</td>
                  <td className="p-2 no-print space-y-1">
                    <div className="flex gap-1">
                      <button onClick={() => printSlip(order, 'KITCHEN')} title="Print Kitchen Slip" className="flex-1 bg-gray-200 text-[10px] p-2 rounded font-bold hover:bg-gray-300">CHEF</button>
                      <button onClick={() => printSlip(order, 'CUSTOMER')} title="Print Invoice" className="flex-1 bg-blue-500 text-white text-[10px] p-2 rounded font-bold hover:bg-blue-600">INVOICE</button>
                    </div>
                    {order.status !== 'Handovered' && (
                      <button onClick={() => handleHandover(order.id)} className="w-full bg-orange-600 text-white text-[10px] p-2 rounded font-bold uppercase hover:bg-orange-700">Handover</button>
                    )}
                    {order.status === 'New' && (
                      <button onClick={() => handlePostpone(order)} className="w-full bg-yellow-400 text-[10px] p-1 rounded font-bold hover:bg-yellow-500 uppercase">Credit / Postpone</button>
                    )}
                    {order.status === 'Handovered' && <div className="text-center text-green-600 font-black text-[10px] p-1 bg-white border border-green-200 rounded">COMPLETED ✅</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="border-4 border-black p-4 inline-block min-w-[300px] bg-gray-50 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black uppercase">Grand Total:</span>
              <span className="text-3xl font-black">Rs. {grandTotalAll.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center no-print">
          <button onClick={() => window.print()} className="bg-black text-white px-10 py-4 font-black uppercase hover:bg-gray-800 transition-all shadow-xl active:scale-95">🖨️ Print Daily Summary Report</button>
        </div>
      </div>
    </div>
  );
}