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

  // 1. Password Security Check
  const checkPass = () => {
    if (pass === 'ruwan123') setIsAuth(true); // මෙතනට ඔයාගේ රහස් අංකය දාන්න
    else alert('Wrong Password!');
  };

  useEffect(() => {
    // 2. Real-time Listener (onSnapshot) - නිරන්තරයෙන්ම අප්ඩේට් වේ
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

  // 3. 2:30 PM Logic for Postponing
  const handlePostpone = async (order: any) => {
    const now = new Date();
    const isLate = now.getHours() > 14 || (now.getHours() === 14 && now.getMinutes() > 30);
    
    if (isLate) {
      alert("Cannot cancel/postpone after 2:30 PM. Kitchen is preparing!");
      return;
    }

    if (window.confirm('Postpone this order and keep payment as Credit?')) {
      await updateDoc(doc(db, "orders", order.id), { status: "Postponed" });
    }
  };

  const handleHandover = async (id: string) => {
    await updateDoc(doc(db, "orders", id), { status: "Handovered" });
  };

  // --- Print Function (Previous logic kept) ---
  const printSlip = (order: any, type: string) => { /* කලින් තිබුණු print කේතයම මෙතන තියෙනවා */ };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
        <h2 className="text-2xl font-black mb-4 tracking-widest uppercase">Week Out Admin</h2>
        <input type="password" onChange={(e)=>setPass(e.target.value)} placeholder="Enter Admin Pin" className="bg-white/10 border border-white/20 p-4 rounded-xl text-center mb-4 focus:outline-none focus:border-orange-500" />
        <button onClick={checkPass} className="bg-orange-600 px-10 py-3 rounded-xl font-bold uppercase">Unlock Report</button>
      </div>
    );
  }

  const grandTotalAll = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-black">
      <div className="max-w-7xl mx-auto border-2 border-black p-6">
        {/* Title & Header Section - පරණ විදිහමයි */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black uppercase tracking-widest">Week Out - Online Foods</h1>
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
                <tr key={index} className={`hover:bg-gray-50 border-b border-black/10 ${order.status === 'Handovered' ? 'bg-green-50' : order.status === 'Postponed' ? 'bg-yellow-50' : ''}`}>
                  <td className="border-r border-black p-2 font-mono text-xs font-bold">{order.orderID}</td>
                  <td className="border-r border-black p-2 text-sm">
                    {order.items?.map((it:any, i:number) => <div key={i}>• {it.name} <small>({it.details})</small></div>)}
                    {order.status === 'Postponed' && <div className="text-red-600 font-bold uppercase text-[10px] mt-1">⚠️ POSTPONED (CREDIT)</div>}
                  </td>
                  <td className="border-r border-black p-2 text-center font-bold">{order.items?.reduce((s:number, i:any)=> s + (i.qty||1), 0)}</td>
                  <td className="border-r border-black p-2 text-right">{order.subTotal?.toFixed(2)}</td>
                  <td className="border-r border-black p-2 text-center">{order.paymentMethod === 'COD' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-center">{order.paymentMethod === 'Online' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-right font-black">{order.totalAmount?.toFixed(2)}</td>
                  <td className="p-2 no-print space-y-1">
                    <div className="flex gap-1">
                      <button onClick={() => printSlip(order, 'KITCHEN')} className="flex-1 bg-gray-200 text-[10px] p-1 rounded font-bold">CHEF</button>
                      <button onClick={() => printSlip(order, 'CUSTOMER')} className="flex-1 bg-blue-100 text-[10px] p-1 rounded font-bold">BILL</button>
                    </div>
                    {order.status === 'New' && (
                      <button onClick={() => handlePostpone(order)} className="w-full bg-yellow-400 text-black text-[10px] p-1 rounded font-bold">POSTPONE / CREDIT</button>
                    )}
                    {order.status !== 'Handovered' && (
                      <button onClick={() => handleHandover(order.id)} className="w-full bg-orange-600 text-white text-[10px] p-1 rounded font-bold uppercase">Handover</button>
                    )}
                    {order.status === 'Handovered' && <div className="text-center text-green-600 font-bold text-[10px]">SUCCESS ✅</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Grand Total Footer මෙතනට එනවා... */}
      </div>
    </div>
  );
}