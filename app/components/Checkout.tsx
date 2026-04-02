'use client';

import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Checkout({ cartItems, subTotal, goBack, lang, clearCart }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isCityLimit, setIsCityLimit] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryFee = isCityLimit ? 150 : 250;
  const finalTotal = subTotal + deliveryFee;

  const handleConfirmOrder = async () => {
    if (!name || !phone || !address) {
      alert(lang === 'en' ? 'Please fill all details.' : 'කරුණාකර සියලුම විස්තර පුරවන්න.');
      return;
    }

    setIsProcessing(true);

    try {
      const now = new Date();
      const datePart = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const customOrderID = `WO-${datePart}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

      // --- දත්ත ගබඩා කිරීම (Back-end fixes only) ---
      await addDoc(collection(db, "orders"), {
        orderID: customOrderID,
        customerName: name,
        phone: phone,
        address: address,
        city: "Kegalle", // වෙන්ඩර් පැනල් එකට ඕඩර් එක අල්ලගන්න මෙය රහසින් එකතු කළා
        area: isCityLimit ? 'City Limit' : 'Out of City',
        paymentMethod: paymentMethod,
        items: cartItems.map((item: any) => ({
            name: item.name.en || item.name,
            qty: item.qty || 1,
            price: item.price,
            details: item.details || ''
        })),
        totalPrice: finalTotal, // මේ නිසා පැනල් එකේ ගාණ පේනවා
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      clearCart();
      const whatsappNumber = '94760829235'; 
      const msg = `*NEW ORDER: ${customOrderID}*\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nTotal: Rs.${finalTotal}`;
      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

    } catch (e) {
      alert("Error: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg border relative max-h-[90vh] overflow-y-auto font-sans">
        
        {/* මුල් ආකෘතිය */}
        <button onClick={goBack} disabled={isProcessing} className="absolute top-5 right-5 text-gray-400 font-bold text-xl">✕</button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 uppercase italic tracking-tight">CHECKOUT</h2>
        
        <form className="space-y-4 mt-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full border-2 border-gray-600 rounded-xl p-2.5 font-bold focus:border-orange-500 outline-none" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border-2 border-gray-600 rounded-xl p-2.5 font-bold focus:border-orange-500 outline-none" />
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full border-2 border-gray-600 rounded-xl p-2.5 font-bold focus:border-orange-500 outline-none" rows={2}></textarea>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsCityLimit(true)} className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm ${isCityLimit ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>City</button>
            <button type="button" onClick={() => setIsCityLimit(false)} className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm ${!isCityLimit ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>Out</button>
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={() => setPaymentMethod('COD')} className={`flex-1 py-2 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest ${paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-400'}`}>Cash on Delivery</button>
            <button type="button" onClick={() => setPaymentMethod('Online')} className={`flex-1 py-2 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest ${paymentMethod === 'Online' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-400'}`}>Bank Transfer</button>
          </div>
        </form>

        <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1 font-bold text-gray-600">
          <div className="flex justify-between text-sm"><span>Subtotal:</span><span>Rs. {subTotal}.00</span></div>
          <div className="flex justify-between text-sm pb-2 border-b"><span>Delivery Fee:</span><span>Rs. {deliveryFee}.00</span></div>
          <div className="flex justify-between text-xl text-gray-900 pt-2 font-black italic"><span>TOTAL TO PAY:</span><span>Rs. {finalTotal}.00</span></div>
        </div>

        <button onClick={handleConfirmOrder} disabled={isProcessing} className="w-full mt-6 bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-700 uppercase tracking-widest">
          {isProcessing ? 'Processing...' : 'CONFIRM ORDER'}
        </button>
      </div>
    </div>
  );
}