// FILE: app/page.tsx

'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from './firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import MyOrders from './components/MyOrders';

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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'menu'), (docSnap) => {
      if (docSnap.exists()) {
        const firebaseMenu = docSnap.data();
        setMenuSettings(firebaseMenu);

        const finalItems = Object.keys(firebaseMenu).map(key => {
          return {
            id: key.toLowerCase().replace(/\s+/g, '-'),
            firebaseKey: key,
            name: { 
              en: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '), 
              si: firebaseMenu[key].nameSi || key 
            },
            // 🛡️ පින්තූරය ගන්නේ Database එකේ imageUrl එකෙන්
            image: firebaseMenu[key].imageUrl || '/image_0.png',
            type: firebaseMenu[key].type || 'standard' 
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

  useEffect(() => {
    let price = 0;
    if (!selectedItem || !menuSettings) return;

    const qty = parseInt(itemQty.toString()) || 1;
    const basePrice = menuSettings[selectedItem.firebaseKey]?.price || 0;

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
      if (calcPrice <= 0) calcPrice = basePrice; 
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

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black text-zinc-950 tracking-tighter uppercase italic">{translations.categoryTitle[lang]}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {displayItems.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col items-center">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-gray-100">
                <img src={item.image} alt={item.name[lang]} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-black text-gray-950 uppercase text-center leading-tight mb-4">{item.name[lang]}</h3>
              <button onClick={() => setSelectedItem(item)} className="w-full bg-orange-600 text-white font-black py-4 px-6 rounded-full text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all">
                {translations.addToCart[lang]}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Cart, Checkout, MyOrders modals continue here... */}
      {isMyOrdersOpen && <MyOrders goBack={() => setIsMyOrdersOpen(false)} lang={lang} />}
      {isCartOpen && <Cart cartItems={cartItems} removeFromCart={removeFromCart} closeCart={() => setIsCartOpen(false)} lang={lang} openCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} />}
      {isCheckoutOpen && <Checkout cartItems={cartItems} subTotal={cartItems.reduce((sum, item) => sum + item.price, 0)} goBack={() => { setIsCheckoutOpen(false); setIsCartOpen(true); }} lang={lang} clearCart={() => { setCartItems([]); setIsCheckoutOpen(false); }} />}
    </div>
  );
}