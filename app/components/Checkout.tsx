// FILE: app/components/Checkout.tsx
'use client';

import { useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';

export default function Checkout({ cartItems, subTotal, goBack, clearCart }: any) {
  const [formLang, setFormLang] = useState<'si' | 'en'>('si');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [livingCity, setLivingCity] = useState('');
  const [isCityLimit, setIsCityLimit] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'Online' | 'COD'>('Online');
  const [isProcessing, setIsProcessing] = useState(false);

  const [phoneDigits, setPhoneDigits] = useState(['', '', '', '', '', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const deliveryFee = isCityLimit ? 150 : 250;
  const finalTotal = subTotal + deliveryFee;

  const t = {
    si: {
      title: "CHECKOUT (ගෙවීම් පියවර)",
      name: "NAME (නම)",
      phone: "PHONE NO (දුරකථන අංකය)",
      city: "LIVING CITY (ජීවත්වන නගරය)",
      address: "ADDRESS (ලිපිනය)",
      payMethod: "PAYMENT METHOD (ගෙවීම් ක්‍රමය)",
      tot: "මුළු මුදල",
      btn: "CONFIRM ORDER",
    },
    en: {
      title: "CHECKOUT",
      name: "NAME",
      phone: "PHONE NO",
      city: "LIVING CITY",
      address: "ADDRESS",
      payMethod: "PAYMENT METHOD",
      tot: "TOTAL",
      btn: "CONFIRM ORDER",
    }
  };

  const handlePhoneChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newDigits = [...phoneDigits];
    newDigits[index] = value.substring(value.length - 1);
    setPhoneDigits(newDigits);
    if (value && index < 9) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !phoneDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirmOrder = async () => {
    const fullPhone = phoneDigits.join('');
    if (fullPhone.length !== 10 || !name || !address || !livingCity) {
      alert("සියලු විස්තර නිවැරදිව පුරවන්න.");
      return;
    }

    setIsProcessing(true);

    try {
      // 🛡️ Exact Profit Calculation Logic
      const menuSnap = await getDoc(doc(db, 'settings', 'menu'));
      const menuData = menuSnap.exists() ? menuSnap.data() : {};
      
      let totalAdminProfit = 0;
      cartItems.forEach((item: any) => {
        const sId = item.id === 'rice' ? 'FRIED-RICE' : item.id.toUpperCase();
        const m = menuData[sId];
        
        if (m && m.cost !== undefined) {
          const vendorTotalCost = Number(m.cost) * (item.qty || 1);
          totalAdminProfit += (Number(item.price) - vendorTotalCost);
        } else {
          totalAdminProfit += Math.round(item.price * 0.15);
        }
      });

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB'); 
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const datePart = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const orderID = `WO-${datePart}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

      const formattedCity = livingCity.toUpperCase().trim();
      const finalCity = formattedCity.includes('BRANCH') ? formattedCity : `${formattedCity} BRANCH`;

      await addDoc(collection(db, "orders"), {
        orderID,
        customerName: name,
        phone: fullPhone,
        address,
        city: finalCity,
        area: isCityLimit ? 'City Limit' : 'Out of City',
        paymentMethod: paymentMethod,
        items: cartItems.map((item: any) => ({
            name: item.name?.en || item.name || '',
            qty: item.qty || 1,
            price: Number(item.price) || 0,
            details: item.details || ''
        })),
        subTotal: Number(subTotal),
        deliveryFee: Number(deliveryFee),
        totalPrice: Number(finalTotal),
        totalAmount: Number(finalTotal),
        adminProfit: totalAdminProfit,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      let message = `❖ *NEW ORDER: ${orderID}* ❖\n`;
      message += `◆ Date: ${dateStr} | ◆ Time: ${timeStr}\n\n`;
      message += `*Customer Details:*\n`;
      message += `❖ Name: ${name}\n`;
      message += `❖ Phone: ${fullPhone}\n`;
      message += `❖ City: ${finalCity}\n`;
      message += `❖ Address: ${address}\n\n`;
      message += `*Order Details:*\n`;
      
      cartItems.forEach((item: any, idx: number) => {
        // 🛡️ THE FIX: Remove any existing "2 x " prefix from the raw name before appending the new Qty
        const rawName = item.name?.en || item.name || '';
        const cleanName = rawName.replace(/^\d+\s*x\s*/i, '').trim(); 
        message += `${idx + 1}. ${item.qty || 1} x ${cleanName} - Rs.${item.price}\n`;
      });

      message += `\n*Billing:*\n`;
      message += `Subtotal: Rs.${subTotal}\n`;
      message += `Delivery Fee: Rs.${deliveryFee}\n`;
      message += `*Total to Pay: Rs.${finalTotal}.00*\n\n`;
      message += `*(Note: ${paymentMethod === 'Online' ? 'Online Payment Selected - Send Payment Link' : 'Cash on Delivery Selected'})*`;

      clearCart();
      window.location.href = `https://wa.me/94760829235?text=${encodeURIComponent(message)}`;
    } catch (e) {
      alert("දෝෂයක් සිදු විය: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md font-sans">
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl w-full max-w-lg border-t-8 border-orange-500 relative max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <button onClick={goBack} className="text-gray-400 font-bold text-xl">✕</button>
          <div className="flex gap-2">
            <button onClick={() => setFormLang('si')} className={`px-3 py-1 rounded-full text-[10px] font-black ${formLang === 'si' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}>සිංහල</button>
            <button onClick={() => setFormLang('en')} className={`px-3 py-1 rounded-full text-[10px] font-black ${formLang === 'en' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}>EN</button>
          </div>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-6 text-center uppercase italic tracking-tighter leading-none">{t[formLang].title}</h2>
        <form className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest">{t[formLang].name}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-3 font-bold focus:border-orange-500 outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest">{t[formLang].phone}</label>
            <div className="flex justify-between gap-1">
              {phoneDigits.map((digit, idx) => (
                <input 
                  key={idx} 
                  ref={(el) => { inputRefs.current[idx] = el; }} 
                  type="text" 
                  maxLength={1} 
                  value={digit} 
                  onChange={(e) => handlePhoneChange(e.target.value, idx)} 
                  onKeyDown={(e) => handleKeyDown(e, idx)} 
                  className="w-full h-11 border-2 border-gray-200 rounded-xl text-center font-black text-xl focus:border-orange-500 focus:bg-orange-50 outline-none transition-all shadow-sm" 
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest">{t[formLang].city}</label>
              <input type="text" value={livingCity} onChange={(e) => setLivingCity(e.target.value)} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-3 font-bold focus:border-orange-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest text-center block">AREA</label>
              <div className="flex bg-gray-100 rounded-2xl p-1">
                <button type="button" onClick={() => setIsCityLimit(true)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase ${isCityLimit ? 'bg-white shadow-sm text-orange-600' : 'text-gray-400'}`}>City</button>
                <button type="button" onClick={() => setIsCityLimit(false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase ${!isCityLimit ? 'bg-white shadow-sm text-orange-600' : 'text-gray-400'}`}>Out</button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest">{t[formLang].address}</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-3 font-bold focus:border-orange-500 outline-none" rows={2}></textarea>
          </div>
          <div>
            <label className="text-[10px] font-black text-orange-600 ml-2 uppercase tracking-widest">{t[formLang].payMethod}</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPaymentMethod('Online')} className={`flex-1 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${paymentMethod === 'Online' ? 'border-orange-600 bg-orange-50 text-orange-600 shadow-sm' : 'border-gray-100 text-gray-300'}`}>Bank Transfer / App</button>
              <button type="button" onClick={() => setPaymentMethod('COD')} className={`flex-1 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${paymentMethod === 'COD' ? 'border-orange-600 bg-orange-50 text-orange-600 shadow-sm' : 'border-gray-100 text-gray-300'}`}>Cash on Delivery</button>
            </div>
          </div>
        </form>
        <div className="mt-6 bg-zinc-900 p-6 rounded-[2rem] text-white shadow-xl">
          <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase"><span>Subtotal:</span><span>Rs. {subTotal}.00</span></div>
          <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase pb-2 border-b border-zinc-800"><span>Delivery:</span><span>Rs. {deliveryFee}.00</span></div>
          <div className="flex justify-between text-2xl font-black italic pt-2 tracking-tighter"><span>{t[formLang].tot}:</span><span className="text-orange-500 not-italic font-sans">Rs. {finalTotal}.00</span></div>
        </div>
        <button onClick={handleConfirmOrder} disabled={isProcessing} className="w-full mt-6 bg-orange-600 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-zinc-900 transition-all uppercase tracking-[0.2em] text-xs">
          {isProcessing ? 'Processing...' : t[formLang].btn}
        </button>
      </div>
    </div>
  );
}