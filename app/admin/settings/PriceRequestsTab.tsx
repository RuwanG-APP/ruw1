'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

export default function PriceRequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const qRequests = query(collection(db, 'price_requests'));
    const unsubReq = onSnapshot(qRequests, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubReq();
  }, []);

  const handleRequestAction = async (request: any, action: 'APPROVE' | 'REJECT') => {
    if (!window.confirm(`මෙම ඉල්ලීම ${action === 'APPROVE' ? 'අනුමත' : 'ප්‍රතික්ෂේප'} කිරීමට අවශ්‍යද?`)) return;

    try {
      if (action === 'APPROVE') {
        // අනුමත කළොත් Master Menu එකට අලුත් ගාණ යාවත්කාලීන කිරීම
        const menuRef = doc(db, 'settings', 'menu');
        const menuSnap = await getDoc(menuRef);
        if (menuSnap.exists()) {
          const menuData = menuSnap.data();
          if (menuData[request.itemId]) {
            menuData[request.itemId].cost = request.requestedCost;
            await setDoc(menuRef, menuData);
          }
        }
      }
      
      await updateDoc(doc(db, 'price_requests', request.id), { status: action });
      alert(`ඉල්ලීම සාර්ථකව ${action} කරන ලදී.`);
    } catch (err) {
      alert("Error processing request.");
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {pendingRequests.map(req => (
        <div key={req.id} className="bg-white p-6 rounded-[2rem] shadow-lg border-l-8 border-orange-500 flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex-1 space-y-2">
            <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-full uppercase">New Request</span>
            <h3 className="text-2xl font-black italic tracking-tighter">{req.vendorName} <span className="text-sm text-gray-400">({req.vendorPhone})</span></h3>
            <p className="text-lg font-bold text-gray-800">ITEM: <span className="text-blue-600 uppercase">{req.itemId}</span></p>
            <div className="bg-gray-50 p-4 rounded-xl mt-4 border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reason provided:</p>
              <p className="font-bold text-gray-700 italic normal-case text-sm">"{req.reason}"</p>
            </div>
          </div>

          <div className="flex-1 bg-zinc-50 p-6 rounded-[1.5rem] flex items-center justify-center gap-8 w-full md:w-auto border border-zinc-100">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current</p>
              <p className="text-2xl font-black text-gray-400 line-through">Rs.{req.currentCost}</p>
            </div>
            <div className="text-3xl font-black text-gray-300">➜</div>
            <div className="text-center">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Requested</p>
              <p className="text-3xl font-black text-blue-600">Rs.{req.requestedCost}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button onClick={() => handleRequestAction(req, 'APPROVE')} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-green-700 transition-all">Approve ✅</button>
            <button onClick={() => handleRequestAction(req, 'REJECT')} className="bg-red-100 text-red-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-red-200 transition-all">Reject ❌</button>
          </div>
        </div>
      ))}

      {pendingRequests.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-gray-200">
          <p className="text-gray-400 font-black text-2xl uppercase tracking-tighter italic">No Pending Requests</p>
        </div>
      )}
    </div>
  );
}