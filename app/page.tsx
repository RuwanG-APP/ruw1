'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from './firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import MyOrders from './components/MyOrders';

const translations = {
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
  const [displayItems, setDisplayItems] = useState<any[]>([]); 
  
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

  // 🛡️ 100% Dynamic Data Fetching
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'menu'), (docSnap) => {
      if (docSnap.exists()) {
        const firebaseMenu = docSnap.data();
        setMenuSettings(firebaseMenu);

        // Firestore හි ඇති සියලුම Keys අරගෙන අයිටම් ලිස්ට් එක හදනවා
        const finalItems = Object.keys(firebaseMenu).map(key => {
          const itemData = firebaseMenu[key];
          return {
            id: key.toLowerCase(),
            firebaseKey: key, // Firestore හි Key එක කෙලින්ම ගන්නවා (වැරදීම් නැත)
            name: { 
              en: key, 
              si: itemData.nameSi || key 
            },
            image: itemData.imageUrl || '/image_0.png',
            type: itemData.type || 'standalone' 
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

  // 🛡️ Price Calculation Logic (Zero Profit Protection)
  useEffect(() => {
    let price = 0;
    if (!selectedItem || !menuSettings) return;

    const qty = parseInt(itemQty.toString()) || 1;
    const basePrice = Number(menuSettings[selectedItem.firebaseKey]?.price || 0);

    if (selectedItem.type === 'standalone') {
      price = basePrice * qty;
    }
    else if (selectedItem.type === 'standard') {
      const stdPrices: any = { 
        Vegi: { Full: basePrice - 150, Half: basePrice - 350 }, 
        Fish: { Full: basePrice - 50, Half: basePrice - 250 }, 
        Pork: { Full: basePrice + 50, Half: basePrice - 150 }, 
        Chicken: { Full: basePrice, Half: basePrice - 200 } 
      };
      let calcPrice = stdPrices[meat]?.[portion] || basePrice;
      if (calcPrice <= 0) calcPrice = basePrice; // ආරක්ෂාවට
      price = calcPrice * qty;
    } 
    else if (selectedItem.type === 'biryani') {
      let calcPrice = portion === 'Full' ? basePrice : basePrice - 150;
      price = calcPrice * qty;
    } 
    else if (selectedItem.type === 'devilled') {
      const devPrices: any = { Fish: basePrice - 100, Chicken: basePrice, Pork: basePrice + 150 };
      let calcPrice = devPrices[meat] || basePrice;
      price = calcPrice * qty;
    } 
    else if (selectedItem.type === 'paratha') {
      let gravyPrice = 0;
      if (currySize === 'Gravy Only' || curryType === 'White Curry') {
        gravyPrice = (Math.floor(qty / 5) * 100) + ((qty % 5) * 25);
      } else {
        const curryPrices: any = { Egg: 250, Fish: 300, Chicken: 400, Pork: 500 };
        gravyPrice = curryPrices[curryType] || 0;
      }
      price = (qty * basePrice) + gravyPrice;
    }
    
    setTotalPrice(price > 0 ? price : basePrice * qty);
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      
      <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">W</div>
            <h1 className="text-2xl font-black text-gray-900 italic uppercase">Week <span className="text-orange-600">Out</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 p-1 rounded-full border">
              <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${lang === 'en' ? 'bg-orange-600 text-white shadow' : 'text-gray-500'}`}>EN</button>
              <button onClick={() => setLang('si')} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${lang === 'si' ? 'bg-orange-600 text-white shadow' : 'text-gray-500'}`}>සිං</button>
            </div>
            
            <button onClick={() => setIsMyOrdersOpen(true)} className="px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase transition-colors bg-zinc-900 text-white hover:bg-orange-600 shadow-md">
               {lang === 'en' ? 'Orders' : 'ඇණවුම්'}
            </button>

            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-gray-700 hover:text-orange-600 transition bg-white rounded-full shadow-sm border border-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-zinc-950 tracking-tighter uppercase italic">{translations.categoryTitle[lang]}</h2>
          <p className="mt-2 text-xs sm:text-base font-bold text-gray-500 uppercase tracking-widest">Sri Lankan delicacies, delivered fast.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          {displayItems.map((item) => (
            <div key={item.id} className="bg-white p-3 sm:p-5 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 group flex flex-col items-center">
              <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden mb-3 sm:mb-5 bg-gray-100">
                <img src={item.image} alt={item.name[lang]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-sm sm:text-2xl font-black text-gray-950 tracking-tighter mb-3 sm:mb-4 uppercase text-center leading-tight">{item.name[lang]}</h3>
              <button onClick={() => setSelectedItem(item)} className="w-full mt-auto bg-orange-600 text-white font-black py-3 sm:py-4 px-2 sm:px-6 rounded-2xl sm:rounded-full hover:bg-orange-700 transition duration-150 shadow-md text-[10px] sm:text-xs uppercase tracking-widest active:scale-95">
                {translations.addToCart[lang]}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Item Modal (Bottom Sheet Style) */}
      {selectedItem && (
        <div className="fixed inset-0 bg-zinc-950/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border-t-8 border-orange-500 sm:border-t-0 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300">
            <div className="p-6 sm:p-8 pb-4 shrink-0 relative border-b">
              <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 hover:text-black font-black">✕</button>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tighter uppercase italic">{selectedItem.name[lang]}</h3>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto grow space-y-6">
              {['standard', 'biryani'].includes(selectedItem.type) && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">{translations.portion[lang]}</label>
                  <div className="flex gap-3">
                    {['Full', 'Half'].map((p) => (
                      <button key={p} onClick={() => setPortion(p)} className={`flex-1 py-3 sm:py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${portion === p ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              )}

              {['standard', 'devilled'].includes(selectedItem.type) && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">{translations.meat[lang]}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedItem.type === 'standard' && <button onClick={() => setMeat('Vegi')} className={`py-3 sm:py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${meat === 'Vegi' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 text-gray-400'}`}>Vegi</button>}
                    {['Chicken', 'Fish', 'Pork'].map((m) => (
                      <button key={m} onClick={() => setMeat(m)} className={`py-3 sm:py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${meat === m ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 text-gray-400'}`}>{m}</button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">{translations.qty[lang]}</label>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl w-max">
                  <button onClick={() => setItemQty(Math.max(1, itemQty - 1))} className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl font-black text-gray-400 hover:text-orange-600">-</button>
                  <span className="text-2xl font-black w-10 text-center font-sans text-gray-900">{itemQty}</span>
                  <button onClick={() => setItemQty(itemQty + 1)} className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl font-black text-orange-500 hover:bg-orange-600 hover:text-white">+</button>
                </div>
              </div>

              {selectedItem.type === 'paratha' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">{translations.curryType[lang]}</label>
                    <select value={curryType} onChange={(e) => setCurryType(e.target.value)} className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 font-black text-sm uppercase focus:border-orange-500 outline-none text-gray-700">
                      <option value="Chicken">Chicken (චිකන්)</option>
                      <option value="Fish">Fish (මාළු)</option>
                      <option value="Pork">Pork (පෝක්)</option>
                      <option value="Egg">Egg (බිත්තර)</option>
                      <option value="White Curry">White Curry (කිරිහොදි)</option>
                    </select>
                  </div>
                  {curryType !== 'White Curry' && (
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">{translations.currySize[lang]}</label>
                      <div className="flex gap-3">
                        <button onClick={() => setCurrySize('Gravy Only')} className={`flex-1 py-4 rounded-2xl border-2 font-black text-xs uppercase transition-all ${currySize === 'Gravy Only' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}>Gravy Only</button>
                        <button onClick={() => setCurrySize('Full Curry')} className={`flex-1 py-4 rounded-2xl border-2 font-black text-xs uppercase transition-all ${currySize === 'Full Curry' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}>Full Curry</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8 bg-white border-t border-gray-100 shrink-0 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-3xl font-black text-gray-950 leading-none italic font-sans">Rs. {totalPrice}</p>
              </div>
              <button onClick={handleAddToCart} className="px-8 py-4 rounded-2xl sm:rounded-full font-black bg-orange-600 text-white shadow-xl uppercase text-[10px] tracking-widest active:scale-95 transition-all hover:bg-zinc-900">Add To Cart</button>
            </div>
          </div>
        </div>
      )}

      {isMyOrdersOpen && <MyOrders goBack={() => setIsMyOrdersOpen(false)} lang={lang} />}
      {isCartOpen && <Cart cartItems={cartItems} removeFromCart={(idx:any) => setCartItems(cartItems.filter((_,i)=>i!==idx))} closeCart={() => setIsCartOpen(false)} lang={lang} openCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} />}
      {isCheckoutOpen && <Checkout cartItems={cartItems} subTotal={cartItems.reduce((sum, item) => sum + item.price, 0)} goBack={() => { setIsCheckoutOpen(false); setIsCartOpen(true); }} lang={lang} clearCart={() => { setCartItems([]); setIsCheckoutOpen(false); }} />}
    </div>
  );
}