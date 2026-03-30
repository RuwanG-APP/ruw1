'use client';

import { useState, useEffect } from 'react';
// සටහන: ඔයාගේ Firebase කනෙක්ෂන් එක තියෙන ෆයිල් එක අනුව මේ පේළිය වෙනස් වෙන්න පුළුවන්. 
// (උදා: import { db } from '../../firebase';)
import { collection, getDocs } from 'firebase/firestore'; 
import { db } from '../../firebase'; // <-- මේක ඔයාගේ ඇප් එකේ firebase ෆයිල් එක තියෙන තැනට හදාගන්න

export default function DailyReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const today = new Date().toLocaleDateString();
        
        const todayOrders: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // අද දවසේ ඕඩර්ස් විතරක් වෙන් කරගැනීම (Timestamp එක අනුව)
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

  // ගණනය කිරීම් (Calculations)
  let totalCOD = 0;
  let totalOnline = 0;
  let grandTotal = 0;
  const itemSummary: any = {};

  orders.forEach(order => {
    // Payment totals
    if (order.paymentMethod === 'Cash on Delivery') {
      totalCOD += order.totalPrice || 0;
    } else {
      totalOnline += order.totalPrice || 0;
    }
    grandTotal += order.totalPrice || 0;

    // Items calculation
    if (order.items) {
      order.items.forEach((item: any) => {
        const itemName = item.name.en || item.name;
        if (!itemSummary[itemName]) {
          itemSummary[itemName] = { qty: 0, amount: 0 };
        }
        itemSummary[itemName].qty += item.qty || 1;
        itemSummary[itemName].amount += item.price || 0;
      });
    }
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Loading Report...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100">
        
        {/* Header */}
        <div className="border-b pb-6 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Daily Sales Report</h1>
            <p className="text-gray-500 font-medium mt-1">Date: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right border bg-orange-50 px-4 py-2 rounded-xl border-orange-200">
            <p className="text-xs text-orange-600 font-bold uppercase">Total Orders Today</p>
            <p className="text-2xl font-black text-orange-700">{orders.length}</p>
          </div>
        </div>

        {/* Item Summary Table */}
        <div className="overflow-x-auto mb-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider">
                <th className="p-4 rounded-tl-xl">Item</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4 text-right rounded-tr-xl">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.keys(itemSummary).length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-gray-400">No orders for today yet.</td></tr>
              ) : (
                Object.keys(itemSummary).map((key, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-800">{key}</td>
                    <td className="p-4 text-center font-bold text-gray-600">{itemSummary[key].qty}</td>
                    <td className="p-4 text-right font-black text-gray-900">{itemSummary[key].amount}.00</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <p className="text-blue-600 text-sm font-bold uppercase">Cash On Delivery (COD)</p>
            <p className="text-3xl font-black text-blue-900 mt-2">Rs. {totalCOD}.00</p>
          </div>
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <p className="text-green-600 text-sm font-bold uppercase">Online / Bank Transfer</p>
            <p className="text-3xl font-black text-green-900 mt-2">Rs. {totalOnline}.00</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
            <p className="text-gray-400 text-sm font-bold uppercase">Grand Total</p>
            <p className="text-4xl font-black text-white mt-2">Rs. {grandTotal}.00</p>
          </div>
        </div>

        {/* Print Button */}
        <div className="mt-10 text-center">
          <button 
            onClick={() => window.print()} 
            className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg inline-flex items-center gap-2"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>

      </div>
    </div>
  );
}