// app/components/Checkout.tsx
'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, doc } from 'firebase/firestore';
import { getBaseName } from '../lib/pricing';

export default function Checkout({ cartItems, subTotal, goBack, lang, clearCart }: any) {
  const [isCityLimit, setIsCityLimit] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [menuCosts, setMenuCosts] = useState<any>({});

  const deliveryFee = isCityLimit ? 150 : 250;
  const finalTotal = subTotal + deliveryFee;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'menu'), (snap) => {
      if (snap.exists()) setMenuCosts(snap.data());
    });
    return () => unsub();
  }, []);

  const handleConfirmOrder = async () => {
    if (!name || !phone || !address) {
      alert(lang === 'en' ? 'Fill all details' : 'විස්තර පුරවන්න');
      return;
    }
    setIsProcessing(true);
    try {
      const now = new Date();
      const dateID = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const timeID = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
      const customOrderID = `WO-${dateID}${timeID}`;

      await addDoc(collection(db, "orders"), {
        orderID: customOrderID,
        customerName: name,
        phone: phone,
        address: address,
        paymentMethod: paymentMethod,
        // --- PRICE LOCKING LOGIC ---
        items: cartItems.map((item: any) => {
          const baseName = getBaseName(item.name.en).toLowerCase();
          const menuKey = Object.keys(menuCosts).find(k => k.toLowerCase().includes(baseName)) || baseName;
          return {
            name: item.name.en,
            qty: item.qty || 1,
            price: item.price, // මේ විකුණුම් මිල
            costPrice: Number(menuCosts[menuKey]?.cost || 0), // මේ පිරිවැය (ලොක් කරනු ලැබේ)
            details: item.type === 'paratha' ? `${item.qty} Nos, ${item.curryType}` : `${item.portion}`
          };
        }),
        subTotal: subTotal,
        deliveryFee: deliveryFee,
        totalAmount: finalTotal,
        createdAt: serverTimestamp(),
        status: "New"
      });

      // WhatsApp Logic...
      const message = `*NEW ORDER: ${customOrderID}*\nTotal: Rs.${finalTotal}`;
      clearCart();
      window.location.href = `https://wa.me/94760829235?text=${encodeURIComponent(message)}`;
    } catch (e) { alert("Error!"); } finally { setIsProcessing(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md">
         <h2 className="text-xl font-bold mb-4 uppercase italic">Checkout</h2>
         <input type="text" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" className="w-full border-2 p-3 rounded-xl mb-3 outline-none" />
         <input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Phone" className="w-full border-2 p-3 rounded-xl mb-3 outline-none" />
         <textarea value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="Address" className="w-full border-2 p-3 rounded-xl mb-3 outline-none"></textarea>
         <div className="flex gap-2 mb-4">
            <button onClick={()=>setIsCityLimit(true)} className={`flex-1 p-3 rounded-xl border-2 font-bold ${isCityLimit?'border-orange-500 bg-orange-50':'border-gray-100'}`}>City</button>
            <button onClick={()=>setIsCityLimit(false)} className={`flex-1 p-3 rounded-xl border-2 font-bold ${!isCityLimit?'border-orange-500 bg-orange-50':'border-gray-100'}`}>Out</button>
         </div>
         <div className="bg-gray-100 p-4 rounded-xl mb-4">
            <div className="flex justify-between font-black text-lg"><span>Total:</span><span>Rs. {finalTotal}.00</span></div>
         </div>
         <button onClick={handleConfirmOrder} disabled={isProcessing} className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl">
           {isProcessing ? 'Wait...' : 'CONFIRM ORDER'}
         </button>
         <button onClick={goBack} className="w-full mt-2 text-gray-400 font-bold">Cancel</button>
      </div>
    </div>
  );
}