'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from './firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import MyOrders from './components/MyOrders';

// මෙය අපගේ මූලික මෙනු ආකෘතියයි (Template)
const baseMenuItems = [
  { id: 'kottu', name: { en: 'Kottu', si: 'කොත්තු' }, image: '/image_0.png', type: 'standard' },
  { id: 'paratha', name: { en: 'Paratha', si: 'පරාටා' }, image: '/image_1.png', type: 'paratha' },
  { id: 'rice', name: { en: 'Fried Rice', si: 'රයිස්' }, image: '/image_2.png', type: 'standard' },
  { id: 'biryani', name: { en: 'Biryani', si: 'බිරියානි' }, image: '/image_3.png', type: 'biryani' },
  { id: 'noodles', name: { en: 'Noodles', si: 'නූඩ්ල්ස්' }, image: '/image_4.png', type: 'standard' },
  { id: 'devilled', name: { en: 'Devilled', si: 'ඩෙවල්' }, image: '/image_5.png', type: 'devilled' },
];

const translations = {
  headerTitle: { en: 'Week Out', si: 'Week Out' },
  categoryTitle: { en: 'Explore Our Menu', si: 'අපගේ මෙනුව' },
  addToCart: { en: 'Add to Cart', si: 'Cart එකට දාන්න' },
  portion: { en: 'Portion Size', si: 'ප්‍රමාණය' },
  meat: { en: 'Meat Type', si: 'මස් වර්ගය' },
  qty: { en: 'Quantity', si: 'ප්‍රමාණය (ගණන)' },
  curryType: { en: 'Curry Type', si: 'කරි වර්ගය' },
  currySize: { en: 'Curry Size', si: 'හොදි/කරි ප්‍රමාණය' },
};

export default function WeekOutApp() {
  const [lang, setLang] = useState<'en' | 'si'>('en');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [menuSettings, setMenuSettings] = useState<any>(null);
  const [displayItems, setDisplayItems] = useState<any[]>(baseMenuItems); // සැබෑවටම පෙනෙන ලැයිස්තුව
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  
  const [portion, setPortion] = useState('Full');
  const [meat, setMeat] = useState('Chicken');
  const [itemQty, setItemQty] = useState(1);
  const [curryType, setCurryType] = useState('Chicken');
  const [currySize, setCurrySize] = useState('Gravy Only');
  const [totalPrice, setTotalPrice] = useState(0);

  // 1. Firebase එකෙන් සජීවීව ඩේටා ගෙන මෙනු එක සකස් කිරීම
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'menu'), (docSnap) => {
      if (docSnap.exists()) {
        const firebaseMenu = docSnap.data();
        setMenuSettings(firebaseMenu);

        // 🛡️ මෙතනදී තමයි චීස් කොත්තු වැනි අලුත් ඒවා ඇඩ් වෙන්නේ
        const finalItems = Object.keys(firebaseMenu).map(key => {
          // කලින් තිබුණ කෑමක්දැයි බලමු
          const existing = baseMenuItems.find(m => 
            m.id.toUpperCase() === key || (m.id === 'rice' && key === 'FRIED-RICE')
          );

          if (existing) {
            return { ...existing, firebaseKey: key };
          }

          // අලුතින් ඇඩ් කරපු එකක් නම් (උදා: CHEES KOTTU)
          return {
            id: key.toLowerCase().replace(/\s+/g, '-'),
            firebaseKey: key,
            name: { 
              en: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '), 
              si: key.includes('CHEES') ? 'චීස් කොත්තු' : key 
            },
            image: key.includes('CHEES') ? '/cheese-kottu.png' : '/image_0.png', // චීස් කොත්තු නම් අලුත් පින්තූරය පෙන්වයි
            type: 'standard'
          };
        });

        setDisplayItems(finalItems);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      setPortion('Full');
      setMeat(selectedItem.type === 'standard' || selectedItem.type === 'devilled' ? 'Chicken' : 'Vegi');
      setItemQty(1);
      setCurryType('Chicken');
      setCurrySize('Gravy Only');
    }
  }, [selectedItem]);

  // 2. මිල ගණනය කිරීමේ ලොජික් එක
  useEffect(() => {
    let price = 0;
    if (!selectedItem || !menuSettings) return;

    const qty = parseInt(itemQty.toString()) || 1;
    const basePrice = menuSettings[selectedItem.firebaseKey]?.price || 0;

    if (selectedItem.type === 'standard') {
      const stdPrices: any = { 
        Vegi: { Full: basePrice - 150, Half: basePrice - 350 }, 
        Fish: { Full: basePrice - 50, Half: basePrice - 250 }, 
        Pork: { Full: basePrice + 50, Half: basePrice - 150 }, 
        Chicken: { Full: basePrice, Half: basePrice - 200 } 
      };
      price = (stdPrices[meat]?.[portion] || 0) * qty;
    } 
    else if (selectedItem.type === 'biryani') {
      price = (portion === 'Full' ? basePrice : basePrice - 150) * qty;
    } 
    else if (selectedItem.type === 'devilled') {
      const devPrices: any = { Fish: basePrice - 100, Chicken: basePrice, Pork: basePrice + 150 };
      price = (devPrices[meat] || 0) * qty;
    } 
    else if (selectedItem.type === 'paratha') {
      let gravyPrice = 0;
      if (currySize === 'Gravy Only' || curryType === 'White Curry') {
        gravyPrice = (Math.floor(qty / 5) * 100) + ((qty % 5) * 25);
      } else {
        const curryPrices: any = { Egg: 250, Fish: 300, Chicken: 400, Pork: 500 };
        gravyPrice = curryPrices[curryType] || 0;
      }
      price = (qty * (basePrice || 75)) + gravyPrice;
    }
    
    setTotalPrice(price > 0 ? price : 0);
  }, [selectedItem, portion, meat, itemQty, curryType, currySize, menuSettings]);

  const handleAddToCart = () => {
    const qty = parseInt(itemQty.toString()) || 1;
    const newItem = {
      ...selectedItem,
      name: {
        en: selectedItem.type === 'paratha' || qty === 1 ? selectedItem.name.en : `${qty} x ${selectedItem.name.en}`,
        si: selectedItem.type === 'paratha' || qty === 1 ? selectedItem.name.si : `${qty} x ${selectedItem.name.si}`
      },
      portion, meat, qty: qty, curryType, currySize, price: totalPrice
    };
    setCartItems([...cartItems, newItem]);
    setSelectedItem(null);
    setIsCartOpen(true);
  };

  const removeFromCart = (indexToRemove: number) => {
    setCartItems(cartItems.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">W</div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight hidden sm:block">Week <span className="text-orange-600">Out</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full border">
              <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${lang === 'en' ? 'bg-orange-600 text-white shadow' : 'text-gray-600'}`}>EN</button>
              <button onClick={() => setLang('si')} className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${lang === 'si' ? 'bg-orange-600 text-white shadow' : 'text-gray-600'}`}>සිංහල</button>
            </div>
            
            <button onClick={() => setIsMyOrdersOpen(true)} className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors bg-zinc-800 text-white hover:bg-orange-600">
               {lang === 'en' ? 'My Orders' : 'ඇණවුම්'}
            </button>

            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-gray-700 hover:text-orange-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-950 tracking-tighter">{translations.categoryTitle[lang]}</h2>
          <p className="mt-2 text-lg text-gray-600">Freshly made Sri Lankan delicacies, delivered to your doorstep.</p>
        </div>

        {/* 🥘 මෙන්න මෙතන තමයි සැබෑ ලැයිස්තුව පෙන්වන්නේ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayItems.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-gray-200">
                <Image src={item.image} alt={item.name[lang]} fill sizes="(max-w-768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-950 tracking-tight mb-4 uppercase">{item.name[lang]}</h3>
              <button onClick={() => setSelectedItem(item)} className="w-full mt-auto bg-orange-600 text-white font-bold py-3 px-6 rounded-full hover:bg-orange-700 transition duration-150 shadow-md">
                {translations.addToCart[lang]}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Popup / Detail View */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md border animate-fade-in relative max-h-[90vh] overflow-y-auto overscroll-contain">
            <button onClick={() => setSelectedItem(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 text-xl font-bold">✕</button>
            <h3 className="text-2xl font-bold text-gray-950 tracking-tight mb-6 border-b pb-4 uppercase">{selectedItem.name[lang]}</h3>

            <div className="space-y-5">
              {['standard', 'biryani'].includes(selectedItem.type) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">{translations.portion[lang]}</label>
                  <div className="flex gap-3">
                    {['Full', 'Half'].map((p) => (
                      <button key={p} onClick={() => setPortion(p)} className={`flex-1 py-2 rounded-xl border-2 font-black transition-all ${portion === p ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-400'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              )}

              {['standard', 'devilled'].includes(selectedItem.type) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">{translations.meat[lang]}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedItem.type === 'standard' && <button onClick={() => setMeat('Vegi')} className={`py-2 rounded-xl border-2 font-black transition-all ${meat === 'Vegi' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-400'}`}>Vegi</button>}
                    {['Chicken', 'Fish', 'Pork'].map((m) => (
                      <button key={m} onClick={() => setMeat(m)} className={`py-2 rounded-xl border-2 font-black transition-all ${meat === m ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-400'}`}>{m}</button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">{translations.qty[lang]}</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setItemQty(Math.max(1, itemQty - 1))} className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-2xl font-black text-gray-400 hover:bg-gray-50">-</button>
                  <span className="text-xl font-black w-10 text-center">{itemQty}</span>
                  <button onClick={() => setItemQty(itemQty + 1)} className="w-12 h-12 rounded-xl border-2 border-orange-500 flex items-center justify-center text-2xl font-black text-orange-500 hover:bg-orange-50">+</button>
                </div>
              </div>

              {selectedItem.type === 'paratha' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">{translations.curryType[lang]}</label>
                    <select value={curryType} onChange={(e) => setCurryType(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold">
                      <option value="Chicken">Chicken (චිකන්)</option>
                      <option value="Fish">Fish (මාළු)</option>
                      <option value="Pork">Pork (පෝක්)</option>
                      <option value="Egg">Egg (බිත්තර)</option>
                      <option value="White Curry">White Curry (කිරිහොදි)</option>
                    </select>
                  </div>
                  {curryType !== 'White Curry' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">{translations.currySize[lang]}</label>
                      <div className="flex gap-3">
                        <button onClick={() => setCurrySize('Gravy Only')} className={`flex-1 py-2 rounded-xl border-2 font-black transition-all ${currySize === 'Gravy Only' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-400'}`}>Gravy Only</button>
                        <button onClick={() => setCurrySize('Full Curry')} className={`flex-1 py-2 rounded-xl border-2 font-black transition-all ${currySize === 'Full Curry' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-400'}`}>Full Curry</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</p>
                <p className="text-2xl font-black text-gray-950">Rs. {totalPrice}.00</p>
              </div>
              <button onClick={handleAddToCart} className="px-8 py-3 rounded-full font-black bg-orange-600 text-white shadow-lg uppercase text-[10px] tracking-widest">Add To Cart</button>
            </div>
          </div>
        </div>
      )}

      {isMyOrdersOpen && <MyOrders goBack={() => setIsMyOrdersOpen(false)} lang={lang} />}
      {isCartOpen && <Cart cartItems={cartItems} removeFromCart={removeFromCart} closeCart={() => setIsCartOpen(false)} lang={lang} openCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} />}
      {isCheckoutOpen && <Checkout cartItems={cartItems} subTotal={cartItems.reduce((sum, item) => sum + item.price, 0)} goBack={() => { setIsCheckoutOpen(false); setIsCartOpen(true); }} lang={lang} clearCart={() => { setCartItems([]); setIsCheckoutOpen(false); }} />}
    </div>
  );
}