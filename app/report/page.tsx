// app/report/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore'; 
import { db } from '../firebase';

export default function DailyReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ඕඩර් ටික ගේන ෆන්ක්ෂන් එක
  const fetchTodayOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const today = new Date().toLocaleDateString();
      const todayOrders: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const orderDate = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : '';
        if (orderDate === today) {
          todayOrders.push({ id: doc.id, ...data });
        }
      });
      setOrders(todayOrders);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTodayOrders(); }, []);

  // --- ඩිලිවරි එක භාර දුන්නා කියලා සටහන් කිරීම ---
  const handleHandover = async (orderId: string) => {
    if (window.confirm('Mark this order as Handovered?')) {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "Handovered" });
      fetchTodayOrders(); // රිපෝට් එක අප්ඩේට් කිරීම
    }
  };

  // --- චෙෆ්ට හෝ කස්ටමර්ට බිල ප්‍රින්ට් කිරීම ---
  const printSlip = (order: any, type: 'KITCHEN' | 'CUSTOMER') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>${type} SLIP - ${order.orderID}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; }
            .header { border-bottom: 2px dashed black; padding-bottom: 10px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { text-align: left; padding: 5px; }
            .total { border-top: 2px dashed black; padding-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h2>WEEK OUT - ${type === 'KITCHEN' ? 'KITCHEN COPY' : 'INVOICE'}</h2>
            <p>ID: ${order.orderID} | Date: ${new Date().toLocaleDateString()}</p>
          </div>
          ${type === 'CUSTOMER' ? `<p align="left">Name: ${order.customerName}<br>Address: ${order.address}</p>` : ''}
          <table>
            <thead><tr><th>Item</th><th>Qty</th>${type === 'CUSTOMER' ? '<th>Price</th>' : ''}</tr></thead>
            <tbody>
              ${order.items.map((it: any) => `
                <tr>
                  <td>${it.name}<br><small>(${it.details})</small></td>
                  <td>${it.qty || 1}</td>
                  ${type === 'CUSTOMER' ? `<td>Rs. ${it.price}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${type === 'CUSTOMER' ? `
            <div class="total">
              <p>Subtotal: Rs. ${order.subTotal}.00</p>
              <p>Delivery: Rs. ${order.deliveryFee}.00</p>
              <h3 style="background:#000; color:#fff; padding:5px;">TOTAL: Rs. ${order.totalAmount}.00</h3>
            </div>
          ` : '<p>--- START COOKING ---</p>'}
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Loading...</div>;

  const grandTotalAll = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-black">
      <div className="max-w-7xl mx-auto border-2 border-black p-6">
        
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black uppercase tracking-widest">Week Out - Online Foods</h1>
          <h2 className="text-xl font-bold mt-1 uppercase">Daily Report</h2>
        </div>

        <div className="flex justify-between font-bold text-lg mb-6 px-2">
          <span>Date: {new Date().toLocaleDateString()}</span>
          <span className="no-print">Orders: {orders.length}</span>
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
                <th className="border-2 border-black p-2">Bank</th>
                <th className="border-2 border-black p-2 text-right">Total</th>
                <th className="border-2 border-black p-2 no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className={`hover:bg-gray-50 border-b border-black/10 ${order.status === 'Handovered' ? 'bg-green-50' : ''}`}>
                  <td className="border-r border-black p-2 font-mono text-xs font-bold">{order.orderID || 'N/A'}</td>
                  <td className="border-r border-black p-2 text-sm">
                    {order.items?.map((it: any, i: number) => (
                      <div key={i} className="mb-1 leading-tight">• {it.name} <span className="text-[10px] text-gray-500">({it.details})</span></div>
                    ))}
                    <div className="text-[10px] text-blue-600 font-bold">+ Delivery</div>
                  </td>
                  <td className="border-r border-black p-2 text-center font-bold">
                    {order.items?.reduce((sum: number, it: any) => sum + (it.qty || 1), 0)}
                  </td>
                  <td className="border-r border-black p-2 text-right">{order.subTotal?.toFixed(2)}</td>
                  <td className="border-r border-black p-2 text-center">{order.paymentMethod === 'COD' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-center">{order.paymentMethod === 'Online' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-right font-black">{order.totalAmount?.toFixed(2)}</td>
                  
                  {/* --- අලුත් බටන්ස් ටික --- */}
                  <td className="p-2 no-print space-y-1">
                    <div className="flex gap-1">
                      <button onClick={() => printSlip(order, 'KITCHEN')} className="flex-1 bg-gray-200 text-[10px] p-1 rounded font-bold hover:bg-gray-300">🍳 CHEF</button>
                      <button onClick={() => printSlip(order, 'CUSTOMER')} className="flex-1 bg-blue-100 text-[10px] p-1 rounded font-bold hover:bg-blue-200">🧾 BILL</button>
                    </div>
                    {order.status === 'Handovered' ? (
                      <div className="text-center text-green-600 font-bold text-[10px]">DONE ✅</div>
                    ) : (
                      <button onClick={() => handleHandover(order.id)} className="w-full bg-orange-600 text-white text-[10px] p-1 rounded font-bold">HANDOVER</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="border-4 border-black p-4 min-w-[250px]">
            <div className="flex justify-between items-center font-black">
              <span className="text-xl uppercase">Grand Total:</span>
              <span className="text-2xl">Rs. {grandTotalAll.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center no-print">
          <button onClick={() => window.print()} className="bg-black text-white px-10 py-4 font-black uppercase tracking-widest hover:bg-gray-800">
            🖨️ Print Daily Summary
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  );
}