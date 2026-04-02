'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, increment } from 'firebase/firestore';

export default function Checkout({ cartItems: rawCartItems, subTotal, goBack, lang, clearCart }: any) {
  const cartItems = rawCartItems || [];
  
  // පරණ විදිහටම තිබුණු States ටික
  const [isCityLimit, setIsCityLimit] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Online');  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryFee = isCityLimit ? 150 : 250;
  const finalTotal = subTotal + deliveryFee;

  const handleConfirmOrder = async () => {
    if (!name || !phone || !address) {
      alert(lang === 'en' ? 'Please fill in all details.' : 'කරුණාකර සියලුම විස්තර පුරවන්න.');
      return;
    }

    setIsProcessing(true);

    try {
      const now = new Date();
      const datePart = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const timePart = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
      const customOrderID = `WO-${datePart}${timePart}`;

      // --- මාලාගේ ඩෑෂ්බෝඩ් එකේ ඕඩර් එක පෙනීමට අවශ්‍ය තාක්ෂණික වෙනස්කම් ---
      await addDoc(collection(db, "orders"), {
        orderID: customOrderID,
        orderDateOnly: datePart,
        customerName: name,
        phone: phone,
        address: address,
        city: "Kegalle", // වෙන්ඩර් පැනල් එකේ ෆිල්ටර් කිරීමට මෙය අත්‍යවශ්‍යයි (පිටතට නොපෙනේ)
        area: isCityLimit ? 'City Limit' : 'Out of City',
        paymentMethod: paymentMethod,
        items: cartItems.map((item: any) => ({
            name: item.name.en || item.name,
            qty: item.qty || 1,
            price: item.price,
            details: item.details || ''
        })),
        subTotal: subTotal,
        deliveryFee: deliveryFee,
        totalPrice: finalTotal, // මේ ෆීල්ඩ් එක නිසා දැන් ඩෑෂ්බෝඩ් එකේ ගාණ 0 වෙන්නේ නැත
        createdAt: serverTimestamp(),
        status: "Pending" // මුල් අවස්ථාව Pending ලෙස සේව් වේ
      });

      // WhatsApp Message
      let message = `❖ *NEW ORDER: ${customOrderID}* ❖\n\n`;
      message += `*Customer:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}\n\n`;
      message += `*Total: Rs.${finalTotal}.00*`;

      clearCart();
      const whatsappNumber = '94760829235'; 
      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    } catch (error) {
      alert("Database error! Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg border relative max-h-[90vh] overflow-y-auto font-sans">
        
        {/* පිරිසිදු මුල් පෙනුම */}
        <button onClick={goBack} disabled={isProcessing} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 font-bold text-xl disabled:opacity-50 font-sans">✕</button>
        <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase italic tracking-tighter font-sans">CHECKOUT</h2>
        
        <form className="space-y-4 mt-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full border-2 border-gray-600 rounded-xl p-3 font-bold focus:border-orange-500 outline-none" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border-2 border-gray-600 rounded-xl p-3 font-bold focus:border-orange-500 outline-none" />
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full border-2 border-gray-600 rounded-xl p-3 font-bold focus:border-orange-500 outline-none" rows={2}></textarea>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsCityLimit(true)} className={`flex-1 py-2 rounded-xl border-2 font-bold text-xs uppercase tracking-widest ${isCityLimit ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-400'}`}>City</button>
            <button type="button" onClick={() => setIsCityLimit(false)} className={`flex-1 py-2 rounded-xl border-2 font-bold text-xs uppercase tracking-widest ${!isCityLimit ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-400'}`}>Out</button>
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={() => setPaymentMethod('COD')} className={`flex-1 py-2 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest ${paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-400'}`}>Cash on Delivery</button>
            <button type="button" onClick={() => setPaymentMethod('Online')} className={`flex-1 py-2 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest ${paymentMethod === 'Online' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-400'}`}>Bank Transfer</button>
          </div>
        </form>

        <div className="mt-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest"><span>Subtotal:</span><span>Rs. {subTotal}.00</span></div>
          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b"><span>Delivery:</span><span>Rs. {deliveryFee}.00</span></div>
          <div className="flex justify-between text-xl font-black text-gray-900 pt-2 tracking-tighter italic"><span>TOTAL:</span><span>Rs. {finalTotal}.00</span></div>
        </div>

        <button onClick={handleConfirmOrder} disabled={isProcessing} className="w-full mt-6 bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-orange-700 transition-all uppercase tracking-widest text-xs">
          {isProcessing ? 'Processing...' : 'CONFIRM ORDER'}
        </button>
      </div>
    </div>
  );
}