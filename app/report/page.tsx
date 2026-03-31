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

  // 1. Password Check
  const checkPass = () => {
    if (pass === 'ruwan123') setIsAuth(true);
    else alert('වැරදි මුරපදයක්!');
  };

  useEffect(() => {
    // 2. Fetch Menu Costs for Profit calculation
    async function fetchCosts() {
      const snap = await getDoc(doc(db, 'settings', 'menu'));
      if (snap.exists()) setMenuCosts(snap.data());
    }
    fetchCosts();

    // 3. Real-time Orders Listener
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

  // Calculation Logic
  const grandTotalAll = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  // ලාභය ගණනය කිරීම: (Total - (Cost * Qty))
  const estimatedProfit = orders.reduce((sum, order) => {
    const orderCost = order.items?.reduce((oSum: number, item: any) => {
      // මෙතනදී අපි menuCosts වලින් අදාළ කෑමේ පිරිවැය සොයා ගන්නවා
      const itemName = item.name.toLowerCase().replace(' ', '-');
      const unitCost = menuCosts[itemName]?.cost || 0;
      return oSum + (unitCost * (item.qty || 1));
    }, 0);
    return sum + ((order.totalAmount - order.deliveryFee) - orderCost);
  }, 0);

  // --- Print Function & Other Handlers ---
  const handleHandover = async (id: string) => { await updateDoc(doc(db, "orders", id), { status: "Handovered" }); };
  const printSlip = (order: any, type: string) => { /* කලින් තිබුණු print කේතයම */ };

  // --- Login Screen (අර කළු කොටුව හදපු තැන) ---
  if (!isAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 font-sans">
        <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 shadow-2xl text-center max-w-sm w-full">
          <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">Week Out Admin</h2>
          <input 
            type="password" 
            autoFocus
            onChange={(e)=>setPass(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && checkPass()}
            placeholder="මුරපදය ඇතුළත් කරන්න" 
            className="w-full bg-white text-black p-4 rounded-2xl text-center mb-6 font-bold text-xl outline-none ring-4 ring-zinc-800 focus:ring-orange-600 transition-all" 
          />
          <button onClick={checkPass} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all">
            Unlock System
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-black">
      <div className="max-w-7xl mx-auto border-2 border-black p-6">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black uppercase">Week Out - Online Foods</h1>
          <h2 className="text-xl font-bold mt-1 text-gray-500 uppercase italic">Live Control Center</h2>
        </div>

        {/* --- Table Section (පරණ ආකෘතියමයි) --- */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className="bg-zinc-100 text-xs uppercase font-black">
                <th className="border-2 border-black p-2">Order ID</th>
                <th className="border-2 border-black p-2 text-left">Item Details</th>
                <th className="border-2 border-black p-2">Qty</th>
                <th className="border-2 border-black p-2 text-right">Amart</th>
                <th className="border-2 border-black p-2">CoD</th>
                <th className="border-2 border-black p-2">Bank</th>
                <th className="border-2 border-black p-2 text-right">Total</th>
                <th className="border-2 border-black p-2 no-print">Manage</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index} className={`border-b border-black/10 ${order.status === 'Handovered' ? 'bg-green-50' : ''}`}>
                  <td className="border-r border-black p-2 font-mono text-[10px] font-bold">{order.orderID}</td>
                  <td className="border-r border-black p-2 text-sm font-medium">
                     <div className="text-blue-700 uppercase font-black text-xs mb-1">{order.customerName}</div>
                     {order.items?.map((it:any, i:number) => <div key={i} className="text-[11px] leading-tight">• {it.name} <span className="text-gray-400">({it.details})</span></div>)}
                  </td>
                  <td className="border-r border-black p-2 text-center font-bold">{order.items?.reduce((s:number, i:any)=> s + (i.qty||1), 0)}</td>
                  <td className="border-r border-black p-2 text-right font-mono">{order.subTotal?.toFixed(2)}</td>
                  <td className="border-r border-black p-2 text-center">{order.paymentMethod === 'COD' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-center text-blue-600 font-bold">{order.paymentMethod === 'Online' ? '✔' : '-'}</td>
                  <td className="border-r border-black p-2 text-right font-black bg-zinc-50">{order.totalAmount?.toFixed(2)}</td>
                  <td className="p-2 no-print flex gap-1">
                      <button onClick={() => printSlip(order, 'KITCHEN')} className="bg-zinc-200 text-[9px] p-1.5 rounded font-black">CHEF</button>
                      <button onClick={() => printSlip(order, 'CUSTOMER')} className="bg-blue-600 text-white text-[9px] p-1.5 rounded font-black">BILL</button>
                      {order.status !== 'Handovered' && <button onClick={() => handleHandover(order.id)} className="bg-orange-600 text-white text-[9px] p-1.5 rounded font-black">DONE</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- ඔයා ඉල්ලපු ලාභය සහ මුළු ගණන පෙන්වන කොටස (2) --- */}
        <div className="mt-8 flex flex-col items-end gap-3">
          <div className="border-2 border-dashed border-zinc-300 p-4 min-w-[300px] text-right">
             <span className="text-gray-500 font-bold uppercase text-xs">Estimated Daily Profit:</span>
             <span className="text-2xl font-black text-green-600 ml-4">Rs. {estimatedProfit.toFixed(2)}</span>
          </div>
          
          <div className="bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] min-w-[350px]">
            <div className="flex justify-between items-center">
              <span className="text-xl font-black uppercase tracking-tighter">Grand Total:</span>
              <span className="text-4xl font-black underline decoration-orange-500">Rs. {grandTotalAll.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center no-print flex justify-center gap-4">
           <button onClick={() => window.location.href='/admin/settings'} className="bg-zinc-100 text-zinc-500 px-6 py-4 font-bold rounded-xl hover:bg-zinc-200 transition-all italic underline">Business Settings</button>
           <button onClick={() => window.print()} className="bg-zinc-900 text-white px-10 py-4 font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">🖨️ Print Full Report</button>
        </div>
      </div>
    </div>
  );
}