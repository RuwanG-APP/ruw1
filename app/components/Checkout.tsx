import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Checkout({ cartItems: rawCartItems, subTotal, goBack, lang, clearCart }: any) {
  const cartItems = rawCartItems || [];

  const [isCityLimit, setIsCityLimit] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Online'); 
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryFee = isCityLimit ? 150 : 250;
  const finalTotal = subTotal + deliveryFee;

  const handleConfirmOrder = async () => {
    if (!name || !phone || !address) {
      alert(lang === 'en' ? 'Please fill in all details.' : 'කරුණාකර සියලුම විස්තර පුරවන්න.');
      return;
    }

    setIsProcessing(true);

    try {
      const now = new Date();
      const datePart = now.getFullYear() + 
                       String(now.getMonth() + 1).padStart(2, '0') + 
                       String(now.getDate()).padStart(2, '0');
      const timePart = String(now.getHours()).padStart(2, '0') + 
                       String(now.getMinutes()).padStart(2, '0');
      
      const customOrderID = `WO-${datePart}${timePart}`;

      if (paymentMethod === 'Online') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      await addDoc(collection(db, "orders"), {
        orderID: customOrderID,
        orderDateOnly: datePart,
        customerName: name,
        phone: phone,
        address: address,
        area: isCityLimit ? 'City Limit' : 'Out of City',
        paymentMethod: paymentMethod,
        items: cartItems.map((item: any) => ({
            name: item.name.en,
            qty: item.qty || 1,
            price: item.price,
            details: item.type === 'paratha' 
              ? `${item.qty} Nos, ${item.curryType} (${item.currySize})` 
              : `${item.portion} - ${item.meat}`
        })),
        subTotal: subTotal,
        deliveryFee: deliveryFee,
        totalAmount: finalTotal,
        createdAt: serverTimestamp(),
        status: paymentMethod === 'Online' ? "Paid (Pending Gateway)" : "New"
      });

      let message = `❖ *NEW ORDER: ${customOrderID}* ❖\n\n`;
      message += `*Customer Details:*\n`;
      message += `❖ Name: ${name}\n`;
      message += `❖ Phone: ${phone}\n`;
      message += `❖ Address: ${address}\n`;
      message += `❖ Area: ${isCityLimit ? 'City Limit' : 'Out of City'}\n`;
      message += `❖ Payment: ${paymentMethod}\n\n`;
      
      message += `*Order Details:*\n`;
      cartItems.forEach((item: any, index: number) => {
        let itemDetails = item.type === 'paratha' 
          ? `${item.qty} Nos, ${item.curryType} (${item.currySize})` 
          : `${item.portion} - ${item.meat}`;
        message += `${index + 1}. ${item.name.en} (${itemDetails}) - Rs.${item.price}\n`;
      });

      message += `\n*Billing:*\n`;
      message += `Subtotal: Rs.${subTotal}\n`;
      message += `Delivery Fee: Rs.${deliveryFee}\n`;
      message += `*Total: Rs.${finalTotal}*\n`;

      if (paymentMethod === 'Online') {
          message += `\n_(Note: Online Payment Selected - Send Payment Link)_`;
      }

      clearCart();
      
      const whatsappNumber = '94760829235'; 
      const encodedMessage = encodeURIComponent(message);
      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    } catch (error) {
      console.error("Error saving order: ", error);
      alert("Database error! Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg border animate-fade-in relative max-h-[90vh] overflow-y-auto">
        <button onClick={goBack} disabled={isProcessing} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 font-bold text-xl disabled:opacity-50">✕</button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2 uppercase italic tracking-tight">
          CHECKOUT
        </h2>
        
        <form className="space-y-4 mt-4">
          <div>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing} className="w-full border-2 border-gray-600 rounded-xl p-2.5 focus:border-orange-500 focus:outline-none disabled:bg-gray-100" placeholder="Name" />
          </div>
          <div>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isProcessing} className="w-full border-2 border-gray-600 rounded-xl p-2.5 focus:border-orange-500 focus:outline-none disabled:bg-gray-100" placeholder="Phone" />
          </div>
          <div>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} disabled={isProcessing} className="w-full border-2 border-gray-600 rounded-xl p-2.5 focus:border-orange-500 focus:outline-none disabled:bg-gray-100" rows={2} placeholder="Address"></textarea>
          </div>

          <div className="pt-2">
            <div className="flex gap-3">
              <button type="button" disabled={isProcessing} onClick={() => setIsCityLimit(true)} className={`flex-1 py-2 px-2 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-50 ${isCityLimit ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                City
              </button>
              <button type="button" disabled={isProcessing} onClick={() => setIsCityLimit(false)} className={`flex-1 py-2 px-2 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-50 ${!isCityLimit ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                Out
              </button>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex gap-3">
              <button type="button" disabled={isProcessing} onClick={() => setPaymentMethod('COD')} className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-50 ${paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                Cash on Delivery
              </button>
              <button type="button" disabled={isProcessing} onClick={() => setPaymentMethod('Online')} className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-50 ${paymentMethod === 'Online' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                Bank Transfer
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex justify-between text-sm text-gray-600 mb-1 font-bold">
            <span>Subtotal:</span><span>Rs. {subTotal}.00</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-3 border-b border-gray-200 pb-3 font-bold">
            <span>Delivery:</span><span>Rs. {deliveryFee}.00</span>
          </div>
          <div className="flex justify-between text-xl font-black text-gray-900">
            <span>Total:</span><span>Rs. {finalTotal}.00</span>
          </div>
        </div>

        <button 
          onClick={handleConfirmOrder} 
          disabled={isProcessing}
          className="w-full mt-6 text-white font-black py-4 px-4 rounded-xl transition shadow-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-70 uppercase"
        >
          {isProcessing ? 'Processing...' : 'CONFIRM ORDER'}
        </button>
        <div className="text-center mt-3">
            <button onClick={goBack} className="text-gray-400 font-bold text-sm hover:text-gray-700">Cancel</button>
        </div>
      </div>
    </div>
  );
}