'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { SRI_LANKAN_CITIES } from '../constants/cities'; // නගර ලේඛනය ඉම්පෝර්ට් කරන්න

export default function Checkout({ cartItems: rawCartItems, subTotal, goBack, lang, clearCart }: any) {
  const cartItems = rawCartItems || [];

  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Online');
  const [isCityLimit, setIsCityLimit] = useState(true);

  // City Search States
  const [cityInput, setCityInput] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');

  // Wallet & Logic States
  const [walletBalance, setWalletBalance] = useState(0); 
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryFee = isCityLimit ? 150 : 250;
  const finalTotal = subTotal + deliveryFee;

  // Wallet Balance Check
  useEffect(() => {
    const checkWallet = async () => {
      if (phone.length >= 9) { 
        const snap = await getDoc(doc(db, "wallets", phone));
        if (snap.exists()) {
          setWalletBalance(snap.data().balance || 0);
        } else {
          setWalletBalance(0);
        }
      } else {
        setWalletBalance(0);
      }
    };
    checkWallet();
  }, [phone]);

  const usedWalletAmount = Math.min(walletBalance, finalTotal);
  const amountToPay = finalTotal - usedWalletAmount;

  // City Search Logic
  const handleCitySearch = (input: string) => {
    setCityInput(input);
    if (input.length > 0) {
      const filtered = SRI_LANKAN_CITIES.filter(c => 
        c.toLowerCase().startsWith(input.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleConfirmOrder = async () => {
    // නීතිය: නගරය තෝරා නොමැති නම් ඕඩර් එක යවන්න බැහැ
    if (!name || !phone || !address || !selectedCity) {
      alert(lang === 'en' ? 'Please fill in all details and select a town.' : 'කරුණාකර සියලු විස්තර පුරවා නගරයක් තෝරන්න.');
      return;
    }

    setIsProcessing(true);

    try {
      const now = new Date();
      const datePart = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const timePart = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
      const customOrderID = `WO-${datePart}${timePart}`;

      // --- ඩේටාබේස් නීති මාලාවට අනුව සේව් කිරීම ---
      await addDoc(collection(db, "orders"), {
        orderID: customOrderID,
        customerName: name,
        phone: phone,
        address: address,
        city: selectedCity, // වෙන්ඩර් පැනල් එකේ ෆිල්ටර් කිරීමට
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
        walletUsed: usedWalletAmount, 
        totalPrice: finalTotal, // ඩෑෂ්බෝඩ් එකේ පෙන්වන ප්‍රධාන මුදල
        amountToPay: amountToPay,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      // Wallet Update
      if (usedWalletAmount > 0) {
         await setDoc(doc(db, "wallets", phone), { balance: increment(-usedWalletAmount) }, { merge: true });
      }

      // WhatsApp Formatting
      let message = `❖ *NEW ORDER: ${customOrderID}* ❖\n\n`;
      message += `*Customer:*\n❖ Name: ${name}\n❖ Phone: ${phone}\n❖ Address: ${address}\n❖ Town: ${selectedCity}\n\n`;
      message += `*Total to Pay: Rs. ${amountToPay}.00*`;

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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl w-full max-w-lg border relative my-8 font-sans">
        
        <button onClick={goBack} disabled={isProcessing} className="absolute top-6 right-6 text-gray-400 hover:text-orange-600 font-black text-xl transition-colors">✕</button>
        <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase italic tracking-tighter">Checkout</h2>
        
        <div className="space-y-4">
          {/* Name & Phone */}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 focus:border-orange-500 focus:bg-white outline-none font-bold transition-all" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 focus:border-orange-500 focus:bg-white outline-none font-bold transition-all" />
          
          {/* Searchable City Input */}
          <div className="relative">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nearest Town (නගරය)</label>
            <input 
              type="text" 
              value={cityInput} 
              onChange={(e) => handleCitySearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Start typing town... (e.g. Kegalle)" 
              className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 focus:border-orange-500 focus:bg-white outline-none font-bold transition-all" 
            />
            {showSuggestions && filteredCities.length > 0 && (
              <div className="absolute z-50 w-full bg-white border-2 border-gray-100 mt-1 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                {filteredCities.map((city, idx) => (
                  <div key={idx} onClick={() => { setCityInput(city); setSelectedCity(city); setShowSuggestions(false); }} className="p-4 hover:bg-orange-50 cursor-pointer font-black text-gray-700 text-sm border-b last:border-0 uppercase tracking-tighter italic">
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>

          <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full Delivery Address" className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 focus:border-orange-500 focus:bg-white outline-none font-bold transition-all" rows={2}></textarea>

          {/* Area Select */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
             <button type="button" onClick={() => setIsCityLimit(true)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isCityLimit ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>City Limit</button>
             <button type="button" onClick={() => setIsCityLimit(false)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!isCityLimit ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>Out of City</button>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="mt-8 bg-zinc-900 p-6 rounded-[2rem] text-white space-y-2 shadow-xl border-b-4 border-orange-500">
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase"><span>Subtotal</span><span>Rs. {subTotal}.00</span></div>
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase pb-2 border-b border-white/10"><span>Delivery Fee</span><span>Rs. {deliveryFee}.00</span></div>
          
          {walletBalance > 0 && (
            <div className="flex justify-between text-[10px] font-black text-green-400 uppercase italic"><span>Wallet Discount</span><span>- Rs. {usedWalletAmount}.00</span></div>
          )}
          
          <div className="flex justify-between text-xl font-black pt-2 tracking-tighter">
            <span className="italic uppercase">Total to Pay</span>
            <span className="text-orange-500">Rs. {amountToPay}.00</span>
          </div>
        </div>

        <button onClick={handleConfirmOrder} disabled={isProcessing} className="w-full mt-6 bg-orange-600 text-white font-black py-5 rounded-[1.5rem] shadow-lg hover:bg-zinc-900 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50">
          {isProcessing ? 'Processing Order...' : 'Confirm & Send to WhatsApp'}
        </button>
      </div>
    </div>
  );
}