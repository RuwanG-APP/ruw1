'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, increment } from 'firebase/firestore';

// --- නගර ලේඛනය මෙතනටම දැම්මා (Build Error එක වැළැක්වීමට) ---
const SRI_LANKAN_CITIES = [
  "Kegalle", "Mawanella", "Galigamuwa", "Rambukkana", "Warakapola", 
  "Colombo", "Kandy", "Galle", "Negombo", "Kurunegala", "Gampaha",
  "Pinnawala", "Hemmathagama", "Aranayaka", "Kitulgala"
];

export default function Checkout({ cartItems: rawCartItems, subTotal, goBack, lang, clearCart }: any) {
  const cartItems = rawCartItems || [];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Online');
  const [isCityLimit, setIsCityLimit] = useState(true);

  const [cityInput, setCityInput] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryFee = isCityLimit ? 150 : 250;
  const finalTotal = subTotal + deliveryFee;

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
    if (!name || !phone || !address || !selectedCity) {
      alert(lang === 'en' ? 'Please fill all and select a town.' : 'කරුණාකර සියලු විස්තර පුරවා නගරයක් තෝරන්න.');
      return;
    }

    setIsProcessing(true);

    try {
      const now = new Date();
      const datePart = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const timePart = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
      const customOrderID = `WO-${datePart}${timePart}`;

      await addDoc(collection(db, "orders"), {
        orderID: customOrderID,
        customerName: name,
        phone: phone,
        address: address,
        city: selectedCity, // ඩෑෂ්බෝඩ් එකේ පෙරීමට අවශ්‍යයි
        area: isCityLimit ? 'City Limit' : 'Out of City',
        paymentMethod: paymentMethod,
        items: cartItems.map((item: any) => ({
            name: item.name?.en || item.name || 'Item',
            qty: item.qty || 1,
            price: item.price || 0,
            details: item.details || ''
        })),
        totalPrice: finalTotal,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      clearCart();
      const whatsappNumber = '94760829235'; 
      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('New Order: ' + customOrderID)}`;

    } catch (error) {
      alert("Error: " + error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl w-full max-w-lg border relative my-8 font-sans">
        <button onClick={goBack} disabled={isProcessing} className="absolute top-6 right-6 text-gray-400 font-bold text-xl font-sans">✕</button>
        <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase italic tracking-tighter">Checkout</h2>
        
        <div className="space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:border-orange-500" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:border-orange-500" />
          
          <div className="relative">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Town (නගරය)</label>
            <input 
              type="text" 
              value={cityInput} 
              onChange={(e) => handleCitySearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Start typing town..." 
              className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:border-orange-500" 
            />
            {showSuggestions && filteredCities.length > 0 && (
              <div className="absolute z-50 w-full bg-white border-2 border-gray-100 mt-1 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                {filteredCities.map((city, idx) => (
                  <div key={idx} onClick={() => { setCityInput(city); setSelectedCity(city); setShowSuggestions(false); }} className="p-4 hover:bg-orange-50 cursor-pointer font-black text-gray-700 text-sm uppercase italic">
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>

          <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:border-orange-500" rows={2}></textarea>

          <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
             <button type="button" onClick={() => setIsCityLimit(true)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${isCityLimit ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>City Limit</button>
             <button type="button" onClick={() => setIsCityLimit(false)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${!isCityLimit ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>Out</button>
          </div>
        </div>

        <div className="mt-8 bg-zinc-900 p-6 rounded-[2rem] text-white shadow-xl border-b-4 border-orange-500">
          <div className="flex justify-between text-xl font-black tracking-tighter">
            <span className="italic">Total</span>
            <span className="text-orange-500">Rs. {finalTotal}.00</span>
          </div>
        </div>

        <button onClick={handleConfirmOrder} disabled={isProcessing} className="w-full mt-6 bg-orange-600 text-white font-black py-5 rounded-[1.5rem] shadow-lg hover:bg-zinc-900 transition-all uppercase tracking-[0.2em] text-xs">
          {isProcessing ? 'Processing...' : 'Confirm Order'}
        </button>
      </div>
    </div>
  );
}