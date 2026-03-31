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

  // 1. Password Security
  const checkPass = () => {
    if (pass === 'ruwan123') setIsAuth(true);
    else alert('Wrong Password!');
  };

  useEffect(() => {
    // 2. Real-time Listener (Ascending order)
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

  // 3. Handover & Postpone logic
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

  // 4. Print Slip Function (Chef & Bill)
  const printSlip = (order: any, type: 'KITCHEN' | 'CUSTOMER') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>${type} SLIP</title>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; }
            .header { border-bottom: 2px dashed black; padding-bottom: 10px; }
            table { width: 100%; margin: 10px 0; border-collapse: collapse; }
            th, td { text-align: left; padding: 5px; }
            .total { border-top: 2px dashed black; margin-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h2>WEEK OUT - ${type === 'KITCHEN' ? 'CHEF COPY' : 'INVOICE'}</h2>
            <p>Order ID: ${order.orderID}</p>
          </div>
          <table>
            ${order.items.map((it: any) => `
              <tr><td>${it.name} (${it.details})</td><td>x${it.qty || 1}</td></tr>
            `).join('')}
          </table>
          ${type === 'CUSTOMER' ? `
            <div class="total">
              <p>Delivery Fee: Rs. ${order.deliveryFee}.00</p>
              <h3>TOTAL: Rs. ${order.totalAmount}.00</h3>
            </div>
          ` : '<p>--- Kitchen Order ---</p>'}
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
        <h2 className="text-2xl font-black mb-4 uppercase">Week Out Admin</h2>
        <input type="password" onChange={(e)=>setPass(e.target.value)} placeholder="Enter Pin" className="text-black p-4 rounded-xl text-center mb-4" />
        <button onClick={checkPass} className="bg-orange-600 px-10 py-3 rounded-xl font-bold">UNLOCK</button>
      </div>
    );
  }

  const grandTotalAll = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-black">
      <div className="max-w-7xl mx-auto border-2 border-black p-6">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black uppercase">Week Out - Online Foods</h1>
          <h2 className="text-xl font-bold mt-1 uppercase text-gray-500">Real-time Daily Report</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="border-2 border-black p-2">Order ID</th>
                <th className="border-2 border-black p-2 text-left">Item Sold</th>
                <th className="border-2 border-black p-2">Qty</th>
                <th className="border-2 border-black p-2 text-right">Amart</th>
                <th className="border-2 border-black p-2">CoD</th>
                <th className="border-2 border-black p-2 text-center">Bank</th>
                <th className="border-2 border-black p-2 text-right">Total</th>
                <th className="border-2 border-black p-2 no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className={`border-b border-black/10 ${order.status === 'Handovered' ? 'bg-green-50' : ''}`}>
                  <td className="border-r border-black p-2 font-mono text-xs font-bold">{order.orderID}</td>
                  <td className="border-r border-black p-2 text-sm">
                    {order.items?.map((it:any, i:number) => <div key={i}>• {it.name} <small>({it.details})</small></div>)}
                    {order.status === 'Postponed' && <div className="text-red-600 font-bold text-[10px]">⚠️ POSTPONED (CREDIT)</div>}
                  </td>
                  <td className="border-r border-black p-2 text-center font-bold">{order.items?.reduce((s:number, i:any)=> s + (i.qty||1), 0)}</td>
                  <td className="border-r border-black p-2 text-right">{order.subTotal?.toFixed(2)}</td>
                  <td className="border-r border-black p-2 text-center">{order.paymentMethod === 'COD' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-center font-bold text-blue-600">{order.paymentMethod === 'Online' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-right font-black">{order.totalAmount?.toFixed(2)}</td>
                  <td className="p-2 no-print space-y-1">
                    <div className="flex gap-1">
                      <button onClick={() => printSlip(order, 'KITCHEN')} className="flex-1 bg-gray-200 text-[10px] p-2 rounded font-bold hover:bg-gray-300">CHEF</button>
                      <button onClick={() => printSlip(order, 'CUSTOMER')} className="flex-1 bg-blue-100 text-[10px] p-2 rounded font-bold hover:bg-blue-200">BILL</button>
                    </div>
                    {order.status !== 'Handovered' && (
                      <button onClick={() => handleHandover(order.id)} className="w-full bg-orange-600 text-white text-[10px] p-2 rounded font-bold uppercase">Handover</button>
                    )}
                    {order.status === 'New' && (
                      <button onClick={() => handlePostpone(order)} className="w-full bg-yellow-400 text-[10px] p-1 rounded font-bold">POSTPONE</button>
                    )}
                    {order.status === 'Handovered' && <div className="text-center text-green-600 font-bold text-[10px]">SUCCESS ✅</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- මෙන්න මේ කොටස තමයි කලින් අඩු වෙලා තිබුණේ (Grand Total) --- */}
        <div className="mt-8 flex justify-end">
          <div className="border-4 border-black p-4 inline-block min-w-[300px]">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black uppercase">Grand Total:</span>
              <span className="text-3xl font-black">Rs. {grandTotalAll.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center no-print">
          <button onClick={() => window.print()} className="bg-black text-white px-10 py-4 font-black uppercase">🖨️ Print Daily Summary</button>
        </div>
      </div>
    </div>
  );
}