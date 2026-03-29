// app/components/Cart.tsx
import Image from 'next/image';

// මෙන්න මේ උඩ පේළියට තමයි openCheckout කියන එක එකතු වෙන්න ඕනේ 
export default function Cart({ cartItems, removeFromCart, closeCart, lang, openCheckout }: any) {
  const total = cartItems.reduce((sum: number, item: any) => sum + item.price, 0);

  return (
    <>
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={closeCart}></div>
      
      {/* Sliding Cart Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 animate-slide-in">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">{lang === 'en' ? 'Your Cart' : 'ඔබගේ Cart එක'}</h2>
          <button onClick={closeCart} className="text-gray-400 hover:text-red-500 text-2xl font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <p className="text-center text-gray-500 mt-10 font-medium">
              {lang === 'en' ? 'Your cart is empty 🛒' : 'Cart එක හිස් 🛒'}
            </p>
          ) : (
            cartItems.map((item: any, index: number) => (
              <div key={index} className="flex gap-4 border-b border-gray-100 pb-4 items-center">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border">
                  <Image src={item.image} alt={item.name[lang]} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-900">{item.name[lang]}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                    {item.type === 'paratha' 
                      ? `${item.qty} Nos, ${item.curryType} (${item.currySize})` 
                      : `${item.portion} ${item.type !== 'biryani' && item.meat !== 'Vegi' ? `- ${item.meat}` : ''}`
                    }
                  </p>
                  <p className="font-bold text-orange-600 mt-1">Rs. {item.price}.00</p>
                </div>
                <button onClick={() => removeFromCart(index)} className="text-red-400 hover:text-red-600 text-sm font-semibold p-2">
                  {lang === 'en' ? 'Remove' : 'මකන්න'}
                </button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between mb-4 text-lg font-black text-gray-900">
              <span>Total:</span>
              <span>Rs. {total}.00</span>
            </div>
            {/* මෙන්න මේ බටන් එකේ onClick එකට තමයි openCheckout දැම්මේ */}
            <button onClick={openCheckout} className="w-full bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-orange-700 transition shadow-lg flex justify-center items-center gap-2">
              {lang === 'en' ? 'Proceed to Checkout' : 'මිලදී ගන්න (Checkout)'} <span>➔</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}