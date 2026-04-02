'use client';

import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Checkout({ cartItems, subTotal, goBack, lang, clearCart }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [livingCity, setLivingCity] = useState(''); // ජීවත්වන නගරය සඳහා අලුත් state එකක්
  const [isCityLimit, setIsCityLimit] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Online');
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryFee = isCityLimit ? 150 : 250;
  const finalTotal = subTotal + deliveryFee;

  const handleConfirmOrder = async () => {
    // 🛡️ දුරකථන අංකය අංක 10ක් ද කියා පරීක්ෂා කිරීම
    if (phone.length !== 10) {
      alert("කරුණාකර අංක 10කින් යුත් නිවැරදි දුරකථන අංකය ඇතුළත් කරන්න.");
      return;
    }

    if (!name || !address || !livingCity) {
      alert("කරුණාකර සියලු විස්තර (නම, ලිපිනය, නගරය) පුරවන්න.");
      return;
    }

    setIsProcessing(true);

    try {
      const now = new Date();
      const dateString = now.toLocaleDateString();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const datePart = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const customOrderID = `WO-${datePart}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

      // 1. Firebase එකට දත්ත යැවීම
      await addDoc(collection(db, "orders"), {
        orderID: customOrderID,
        customerName: name,
        phone: phone,
        address: address,
        city: livingCity.toUpperCase(), // පාරිභෝගිකයාගේ නගරය
        area: isCityLimit ? 'City Limit' : 'Out of City',
        paymentMethod: paymentMethod,
        items: cartItems.map((item: any) => ({
            name: item.name.en || item.name,
            qty: item.qty || 1,
            price: item.price,
            details: item.details || ''
        })),
        totalPrice: finalTotal,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      // 2. WhatsApp මැසේජ් එක සැකසීම
      let message = `❖ *NEW ORDER: ${customOrderID}* ❖\n`;
      message += `📅 Date: ${dateString} | ⏰ Time: ${timeString}\n\n`;
      message += `*Customer Details:*\n`;
      message += `❖ Name: ${name}\n`;
      message += `❖ Phone: ${phone}\n`;
      message += `❖ City: ${livingCity}\n`;
      message += `❖ Address: ${address}\n\n`;
      
      message += `*Order Details:*\n`;
      cartItems.forEach((item: any, index: number) => {
        let nameStr = item.name.en || item.name;
        message += `${index + 1}. ${item.qty || 1} x ${nameStr} - Rs.${item.price * (item.qty || 1)}\n`;
      });

      message += `\n*Billing:*\nTotal to Pay: Rs.${finalTotal}.00\n`;

      clearCart();
      const whatsappNumber = '94760829235'; 
      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    } catch (e) {
      alert("Error: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg border relative max-h-[90vh] overflow-y-auto font-sans">
        
        <button onClick={goBack} disabled={isProcessing} className="absolute top-5 right-5 text-gray-400 font-bold text-xl">✕</button>
        <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase italic tracking-tighter">CHECKOUT</h2>
        
        <form className="space-y-4">
          {/* NAME */}
          <div>
            <label className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest">NAME (නම)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter Name" className="w-full border-2 border-gray-200 bg-gray-50 rounded-2xl p-3 font-bold focus:border-orange-500 outline-none transition-all" />
          </div>

          {/* PHONE NO */}
          <div>
            <label className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest">PHONE NO (දුරකථන අංකය)</label>
            <input 
              type="tel" 
              value={phone} 
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
              placeholder="07XXXXXXXX" 
              className={`w-full border-2 bg-gray-50 rounded-2xl p-3 font-bold outline-none transition-all ${phone.length === 10 ? 'border-green-500' : 'border-gray-200'}`} 
            />
          </div>

          {/* LIVING CITY */}
          <div>
            <label className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest">LIVING CITY (ජීවත්වන නගරය)</label>
            <input type="text" value={livingCity} onChange={(e) => setLivingCity(e.target.value)} placeholder="Example: Kegalle / Narammala" className="w-full border-2 border-gray-200 bg-gray-50 rounded-2xl p-3 font-bold focus:border-orange-500 outline-none transition-all" />
          </div>

          {/* ADDRESS */}
          <div>
            <label className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest">ADDRESS (ලිපිනය)</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full House Address" className="w-full border-2 border-gray-200 bg-gray-50 rounded-2xl p-3 font-bold focus:border-orange-500 outline-none transition-all" rows={2}></textarea>
          </div>

          {/* DELIVERY AREA */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsCityLimit(true)} className={`flex-1 py-3 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${isCityLimit ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 text-gray-400 bg-gray-50'}`}>City Limit</button>
            <button type="button" onClick={() => setIsCityLimit(false)} className={`flex-1 py-3 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${!isCityLimit ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 text-gray-400 bg-gray-50'}`}>Out</button>
          </div>
        </form>

        <div className="mt-6 bg-zinc-900 p-5 rounded-[2rem] border border-zinc-800 space-y-1 shadow-inner">
          <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest"><span>Subtotal:</span><span>Rs. {subTotal}.00</span></div>
          <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest pb-2 border-b border-zinc-800"><span>Delivery Fee:</span><span>Rs. {deliveryFee}.00</span></div>
          <div className="flex justify-between text-2xl text-white pt-2 font-black italic tracking-tighter"><span>TOTAL:</span><span className="text-orange-500 font-sans not-italic">Rs. {finalTotal}.00</span></div>
        </div>

        <button onClick={handleConfirmOrder} disabled={isProcessing} className="w-full mt-6 bg-orange-600 text-white font-black py-5 rounded-[2rem] shadow-lg hover:bg-orange-700 transition-all uppercase tracking-[0.2em] text-xs">
          {isProcessing ? 'Processing...' : 'CONFIRM ORDER'}
        </button>
      </div>
    </div>
  );
}