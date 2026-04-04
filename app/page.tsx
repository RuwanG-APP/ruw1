// FILE: app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from './firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import MyOrders from './components/MyOrders';

// 🛡️ මුල් අයිටම් 6 ආපසු ලබා දෙන ලදී (පද්ධතියේ ආරක්ෂාව සඳහා)
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
  const [displayItems, setDisplayItems] = useState<any[]>(baseMenuItems); 
  
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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'menu'), (docSnap) => {
      if (docSnap.exists()) {
        const firebaseMenu = docSnap.data();
        setMenuSettings(firebaseMenu);

        // 1. මුල් අයිටම් 6 ටික ඩේටාබේස් එකේ මිල ගණන් වලට සෙට් කිරීම
        const updatedBase = baseMenuItems.map(item => {
           const fbKey = item.id === 'rice' ? 'FRIED-RICE' : item.id.toUpperCase();
           return {
              ...item,
              firebaseKey: fbKey,
              type: firebaseMenu[fbKey]?.type || item.type 
           };
        });

        // 2. ඩේටාබේස් එකේ තියෙන අලුත් අයිටම් (උදා: අච්චාරු) ටික අර 6 ට යටින් එකතු කිරීම
        const newItems: any[] = [];
        Object.keys(firebaseMenu).forEach(key => {
          const isBaseItem = baseMenuItems.find(m => m.id.toUpperCase() === key || (m.id === 'rice' && key === 'FRIED-RICE'));
          if (!isBaseItem) {
            newItems.push({
              id: key.toLowerCase().replace(/\s+/g, '-'),
              firebaseKey: key,
              name: { 
                en: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '), 
                si: firebaseMenu[key].nameSi || key 
              },
              image: firebaseMenu[key].imageUrl || '/image_0.png',
              type: firebaseMenu[key].type || 'standalone' 
            });
          }
        });

        setDisplayItems([...updatedBase, ...newItems]);
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

  useEffect(() => {
    let price = 0;
    if (!selectedItem || !menuSettings) return;

    const qty = parseInt(itemQty.toString()) || 1;
    const basePrice = menuSettings[selectedItem.firebaseKey]?.price || 0;

    // 🛡️ මිල 0 වළක්වන ලොජික් එක
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
    
    setTotalPrice(price > 0 ? price : basePrice * qty); // Fallback to base
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
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-white rounded-full shadow-sm border">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
              {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">{cartItems.length}</span>}
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-4xl sm:text-5xl font-black text-zinc-950 tracking-tighter uppercase italic mb-12">{translations.categoryTitle[lang]}</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          {displayItems.map((item) => (
            <div key={item.id} className="bg-white p-3 sm:p-5 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col items-center">
              <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden mb-3 sm:mb-5 bg-gray-100">
                <img src={item.image} alt={item.name[lang]} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-sm sm:text-2xl font-black text-gray-950 uppercase text-center leading-tight mb-4">{item.name[lang]}</h3>
              <button onClick={() => setSelectedItem(item)} className="w-full bg-orange-600 text-white font-black py-3 sm:py-4 px-4 rounded-2xl sm:rounded-full text-[10px] sm:text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all">
                {translations.addToCart[lang]}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Modal - මම මෙතන 'quantity picker' එක හැම අයිටම් එකකටම පේන්න හැදුවා */}
      {selectedItem && (
        <div className="fixed inset-0 bg-zinc-950/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border-t-8 border-orange-500 sm:border-t-0 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300">
            <div className="p-6 pb-4 shrink-0 relative border-b">
              <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 text-gray-400 font-black">✕</button>
              <h3 className="text-2xl font-black text-gray-950 uppercase italic">{selectedItem.name[lang]}</h3>
            </div>
            
            <div className="p-6 overflow-y-auto grow space-y-6">
              {['standard', 'biryani'].includes(selectedItem.type) && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase">{translations.portion[lang]}</label>
                  <div className="flex gap-3">
                    {['Full', 'Half'].map((p) => (
                      <button key={p} onClick={() => setPortion(p)} className={`flex-1 py-3 rounded-2xl border-2 font-black text-xs uppercase ${portion === p ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              )}

              {['standard', 'devilled'].includes(selectedItem.type) && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase">{translations.meat[lang]}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedItem.type === 'standard' && <button onClick={() => setMeat('Vegi')} className={`py-3 rounded-2xl border-2 font-black text-xs uppercase ${meat === 'Vegi' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}>Vegi</button>}
                    {['Chicken', 'Fish', 'Pork'].map((m) => (
                      <button key={m} onClick={() => setMeat(m)} className={`py-3 rounded-2xl border-2 font-black text-xs uppercase ${meat === m ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}>{m}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ Quantity picker එක හැම එකකටම දාමු */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase">{translations.qty[lang]}</label>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl w-max">
                  <button onClick={() => setItemQty(Math.max(1, itemQty - 1))} className="w-10 h-10 rounded-xl bg-white shadow-sm font-black text-xl">-</button>
                  <span className="text-xl font-black w-8 text-center">{itemQty}</span>
                  <button onClick={() => setItemQty(itemQty + 1)} className="w-10 h-10 rounded-xl bg-white shadow-sm font-black text-xl">+</button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Total</p>
                <p className="text-2xl font-black text-gray-950">Rs. {totalPrice}</p>
              </div>
              <button onClick={handleAddToCart} className="px-8 py-4 bg-orange-600 text-white font-black rounded-full uppercase text-xs shadow-lg active:scale-95 transition-all">Add To Cart</button>
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