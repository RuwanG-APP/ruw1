// app/components/Cart.tsx
import Image from 'next/image';

export default function Cart({ cartItems, removeFromCart, closeCart, lang, openCheckout }: any) {
  const total = cartItems.reduce((sum: number, item: any) => sum + item.price, 0);

  return (
    <>
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity" onClick={closeCart}></div>
      
      {/* Sliding Cart Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 animate-slide-in">
        
        {/* Cart Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            🛒 {lang === 'en' ? 'Your Cart' : 'ඔබගේ Cart එක'}
          </h2>
          <button onClick={closeCart} className="text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors">✕</button>
        </div>

        {/* Back to Menu Button (Always visible at the top of the cart) */}
        <div className="px-5 py-3 bg-white border-b border-gray-100">
          <button 
            onClick={closeCart} 
            className="w-full py-2.5 px-4 rounded-xl border-2 border-orange-100 bg-orange-50 text-orange-600 font-bold hover:bg-orange-100 hover:border-orange-200 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            {lang === 'en' ? 'Back to Menu (Add More)' : 'ආපසු මෙනුවට (තව කෑම තෝරන්න)'}
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70 mt-10">
              <span className="text-6xl">🍽️</span>
              <p className="text-gray-500 text-lg font-medium">
                {lang === 'en' ? 'Your cart is empty' : 'Cart එක හිස්'}
              </p>
              <button 
                onClick={closeCart} 
                className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                {lang === 'en' ? 'Explore Menu' : 'මෙනුව බලන්න'}
              </button>
            </div>
          ) : (
            cartItems.map((item: any, index: number) => (
              <div key={index} className="flex gap-4 border-b border-gray-100 pb-4 items-center bg-white p-2 rounded-xl">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                  <Image src={item.image} alt={item.name[lang]} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-900">{item.name[lang]}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight font-medium">
                    {item.type === 'paratha' 
                      ? `${item.qty} Nos, ${item.curryType} (${item.currySize})` 
                      : `${item.portion} ${item.type !== 'biryani' && item.meat !== 'Vegi' ? `- ${item.meat}` : ''}`
                    }
                  </p>
                  <p className="font-black text-orange-600 mt-1">Rs. {item.price}.00</p>
                </div>
                <button 
                  onClick={() => removeFromCart(index)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  title="Remove"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between mb-4 items-end">
              <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Total Amount</span>
              <span className="text-2xl font-black text-gray-950">Rs. {total}.00</span>
            </div>
            <button 
              onClick={openCheckout} 
              className="w-full bg-orange-600 text-white font-black py-4 px-4 rounded-xl hover:bg-orange-700 transition-all shadow-[0_8px_20px_-6px_rgba(234,88,12,0.5)] flex justify-center items-center gap-3 transform active:scale-[0.98]"
            >
              {lang === 'en' ? 'Proceed to Checkout' : 'මිලදී ගන්න (Checkout)'} 
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}