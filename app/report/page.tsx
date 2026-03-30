// app/report/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; 
import { db } from '../firebase';

export default function DailyReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayOrders = async () => {
      try {
        // අලුත්ම ඕඩර් එක උඩට එන විදිහට ගේනවා
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
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
      } catch (error) {
        console.error("Error fetching orders: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayOrders();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Loading Today's Report...</div>;
  }

  // මුළු එකතුව (Grand Total)
  const grandTotalAll = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-black">
      <div className="max-w-6xl mx-auto border-2 border-black p-6">
        
        {/* Title Section */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black uppercase tracking-widest">Week Out - Online Foods</h1>
          <h2 className="text-xl font-bold mt-1 uppercase">Daily Report</h2>
        </div>

        {/* Date & Time Header */}
        <div className="flex justify-between font-bold text-lg mb-6 px-2">
          <span>Date: {new Date().toLocaleDateString()}</span>
          <span>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Main Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-2 border-black p-2 text-left">Order ID</th>
                <th className="border-2 border-black p-2 text-left">Item Sold</th>
                <th className="border-2 border-black p-2 text-center">Qty</th>
                <th className="border-2 border-black p-2 text-right">Amart</th>
                <th className="border-2 border-black p-2 text-center">CoD</th>
                <th className="border-2 border-black p-2 text-center">Bank</th>
                <th className="border-2 border-black p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center font-bold text-gray-400 italic">No orders recorded for today yet.</td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b border-black/10">
                    {/* Order ID */}
                    <td className="border-r border-black p-2 font-mono text-xs font-bold">{order.orderID || 'N/A'}</td>
                    
                    {/* Items Sold */}
                    <td className="border-r border-black p-2 text-sm">
                      {order.items?.map((it: any, i: number) => (
                        <div key={i} className="mb-1 leading-tight">
                          • {it.name} <span className="text-[10px] text-gray-500">({it.details})</span>
                        </div>
                      ))}
                      {/* Delivery Charge එකත් Row එකේම පෙන්නනවා පැහැදිලි වෙන්න */}
                      <div className="text-[11px] text-blue-600 font-bold mt-1 italic border-t border-dashed border-gray-300 pt-1">
                        + Delivery Charge
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="border-r border-black p-2 text-center font-bold">
                      {order.items?.reduce((sum: number, it: any) => sum + (it.qty || 1), 0)}
                    </td>

                    {/* Amart (Subtotal) */}
                    <td className="border-r border-black p-2 text-right">
                      {order.subTotal?.toFixed(2)}
                    </td>

                    {/* COD Check */}
                    <td className="border-r border-black p-2 text-center font-black text-xl">
                      {order.paymentMethod === 'COD' ? '✔' : '-'}
                    </td>

                    {/* Bank Check */}
                    <td className="border-r border-black p-2 text-center font-black text-xl">
                      {order.paymentMethod === 'Online' ? '✔' : '-'}
                    </td>

                    {/* Total (Subtotal + Delivery) */}
                    <td className="p-2 text-right font-black bg-gray-50">
                      {order.totalAmount?.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Grand Total Footer */}
        <div className="mt-8 flex justify-end">
          <div className="border-4 border-black p-4 inline-block min-w-[300px]">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black uppercase">Grand Total:</span>
              <span className="text-3xl font-black">Rs. {grandTotalAll.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Note Section */}
        <div className="mt-10 pt-4 border-t border-black text-xs text-gray-500 italic flex justify-between uppercase font-bold">
          <span>Generated by Week Out System</span>
          <span className="no-print">Secure Admin Access Only</span>
        </div>

        {/* Print Button (Screen එකේ විතරයි පේන්නේ) */}
        <div className="mt-10 text-center no-print">
          <button 
            onClick={() => window.print()} 
            className="bg-black text-white px-10 py-4 font-black uppercase tracking-widest hover:bg-gray-800 transition shadow-xl active:scale-95"
          >
            🖨️ Print Daily Report
          </button>
        </div>

      </div>

      {/* Printing Styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { padding: 0 !important; margin: 0 !important; }
          .min-h-screen { min-height: auto !important; }
        }
      `}</style>

    </div>
  );
}