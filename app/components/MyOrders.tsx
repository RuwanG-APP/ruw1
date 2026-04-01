import { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, increment } from 'firebase/firestore';

export default function MyOrders({ goBack, lang }: any) {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchOrders = async () => {
    if (!phone) return;
    setLoading(true);
    setMessage('');
    try {
      const q = query(collection(db, "orders"), where("phone", "==", phone));
      const querySnapshot = await getDocs(q);
      const fetchedOrders: any[] = [];
      
      const today = new Date();
      const datePart = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.orderDateOnly === datePart) {
           fetchedOrders.push({ id: docSnap.id, ...data });
        }
      });
      
      fetchedOrders.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

      setOrders(fetchedOrders);
      if (fetchedOrders.length === 0) {
        setMessage(lang === 'en' ? 'No orders found for today.' : 'අද දින සඳහා ඇණවුම් නොමැත.');
      }
    } catch (error) {
      console.error(error);
      setMessage(lang === 'en' ? "Error fetching orders." : "ඇණවුම් ලබාගැනීමේ දෝෂයක්.");
    }
    setLoading(false);
  };

  const handleCancel = async (order: any) => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 14) {
      alert(lang === 'en' ? "Cancellations are only allowed before 2:00 PM." : "ඇණවුම් අවලංගු කළ හැක්කේ ප.ව 2:00 ට පෙර පමණි.");
      return;
    }
    
    // --- අපේ සාධාරණ සහ නඩු නොවැටෙන ගණිතය ---
    const paidAmount = Number(order.totalAmount || 0); // අද අතින්/කාඩ් එකෙන් අලුතින් ගෙවපු ගාණ
    const walletUsed = Number(order.walletUsed || 0);  // පරණ Wallet එකෙන් පාවිච්චි කරපු ගාණ
    
    // අලුත් සල්ලි වලින් 85% ක් කස්ටමර්ට (15% අපේ ලාභය)
    const refundFromPaid = Math.round(paidAmount * 0.85); 
    
    // පරණ සල්ලි 100% ක්ම ආපහු දෙනවා. මුළු එකතුව තමයි වොලට් එකට යන්නේ.
    const totalRefund = walletUsed + refundFromPaid;      

    const confirmCancel = window.confirm(lang === 'en' ? `Are you sure? Rs.${totalRefund} will be refunded to your Wallet.` : `ඔබට විශ්වාසද? රු.${totalRefund} ක් ඔබගේ Wallet එකට එකතු වේ.`);
    if (!confirmCancel) return;

    setLoading(true);
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute:'2-digit', hour12: true });
      
      await updateDoc(doc(db, "orders", order.id), {
         status: "Cancelled - Refunded to Wallet",
         cancelledAtTime: currentTime
      });

      await setDoc(doc(db, "wallets", phone), {
         balance: increment(totalRefund)
      }, { merge: true });

      alert(lang === 'en' ? `Success! Rs.${totalRefund} added to your wallet.` : `සාර්ථකයි! රු.${totalRefund} ක් ඔබගේ Wallet එකට එකතු විය.`);
      fetchOrders(); 
    } catch (error) {
      console.error(error);
      alert(lang === 'en' ? "Error cancelling order." : "අවලංගු කිරීමේ දෝෂයක්.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md border animate-fade-in relative max-h-[80vh] overflow-y-auto">
        <button onClick={goBack} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 font-bold text-xl">✕</button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 italic tracking-tight">
          {lang === 'en' ? 'MY ORDERS' : 'මගේ ඇණවුම්'}
        </h2>
        
        <div className="mb-6 flex gap-2">
           <input 
             type="tel" 
             value={phone} 
             onChange={(e) => setPhone(e.target.value)} 
             placeholder={lang === 'en' ? 'Enter Phone Number' : 'දුරකථන අංකය ඇතුලත් කරන්න'}
             className="flex-1 border-2 border-gray-600 rounded-xl p-2.5 focus:border-orange-500 focus:outline-none" 
           />
           <button onClick={fetchOrders} className="bg-zinc-900 text-white px-4 rounded-xl font-bold hover:bg-orange-600 transition-colors">
             {loading ? '...' : (lang === 'en' ? 'Search' : 'සොයන්න')}
           </button>
        </div>

        {message && <p className="text-red-500 font-bold text-center text-sm">{message}</p>}

        <div className="space-y-4">
          {orders.map((o, i) => {
            const isCancelled = o.status.toLowerCase().includes('cancel');
            const isHandovered = o.status.toLowerCase().includes('handover');
            const isPast2PM = new Date().getHours() >= 14;
            
            const oPaid = Number(o.totalAmount || 0);
            const oWallet = Number(o.walletUsed || 0);
            // බොත්තමේ පෙන්නන ගාණත් අර සාධාරණ ගණිතයටම හැදුවා
            const showRefund = oWallet + Math.round(oPaid * 0.85);

            return (
            <div key={i} className="border-2 border-gray-200 p-4 rounded-xl">
               <div className="flex justify-between items-center mb-2 border-b pb-2">
                 <span className="font-mono text-xs font-bold text-zinc-500">{o.orderID}</span>
                 <span className={`text-xs font-black px-2 py-1 rounded ${isCancelled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{o.status}</span>
               </div>
               <div className="text-sm font-bold text-gray-800 mb-1">
                 {lang === 'en' ? 'Paid Amount: Rs.' : 'ගෙවූ මුදල: රු.'} {o.totalAmount}.00
               </div>
               {o.walletUsed > 0 && (
                 <div className="text-xs font-bold text-green-600 mb-2">
                   Wallet Used: Rs. {o.walletUsed}.00
                 </div>
               )}
               
               {(isCancelled || isHandovered) ? (
                 <button disabled className="w-full bg-gray-100 text-gray-400 border border-gray-200 py-2 rounded-lg font-bold text-sm cursor-not-allowed mt-2">
                   {lang === 'en' ? 'Not Eligible for Cancellation' : 'මෙය අවලංගු කළ නොහැක'}
                 </button>
               ) : isPast2PM ? (
                 <button disabled className="w-full bg-gray-100 text-gray-400 border border-gray-200 py-2 rounded-lg font-bold text-sm cursor-not-allowed mt-2">
                   {lang === 'en' ? 'Cancellation time (2 PM) has passed' : 'ප.ව 2:00 පසු වී ඇති බැවින් අවලංගු කළ නොහැක'}
                 </button>
               ) : (
                 <button onClick={() => handleCancel(o)} className="w-full bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg font-bold text-sm hover:bg-red-600 hover:text-white transition-colors mt-2">
                   {lang === 'en' ? `Cancel Order & Get Rs.${showRefund} Refund` : `ඇණවුම අවලංගු කර රු.${showRefund} ක් ලබාගන්න`}
                 </button>
               )}
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}