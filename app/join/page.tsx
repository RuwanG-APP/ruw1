'use client';

import { useState } from 'react';
import { db } from '../firebase'; // Firebase සම්බන්ධතාවය
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ලංකාවේ දිස්ත්‍රික්ක 25
const districts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", 
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", 
  "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", 
  "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

export default function JoinNetwork() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    district: '',
    city: '', // ප්‍රාදේශීය ලේකම් කොට්ඨාසය / නගරය
    bestFoods: '',
    deliveryMethod: 'Bike',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // ෆෝම් එකේ ඔක්කොම පුරවලද බලනවා
    if (!formData.fullName || !formData.phone || !formData.district || !formData.city || !formData.bestFoods) {
      alert("කරුණාකර සියලුම විස්තර නිවැරදිව පුරවන්න.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Firebase එකේ vendor_applications කියන තැනට ඩේටා යවනවා
      await addDoc(collection(db, 'vendor_applications'), {
        ...formData,
        status: 'Pending', // මුලින්ම පෙන්ඩින් විදිහට වැටෙන්නේ, Super Admin (ඔයා) මේක Approve කරන්න ඕනේ
        appliedAt: serverTimestamp(),
      });
      
      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting application: ", error);
      alert("අයදුම්පත යැවීමේදී දෝෂයක් මතු විය. කරුණාකර නැවත උත්සාහ කරන්න.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-t-8 border-green-500">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">සුබ පැතුම්!</h2>
          <p className="text-gray-600 font-bold mb-6">
            ඔබගේ අයදුම්පත සාර්ථකව අප වෙත ලැබුණි. අපගේ කණ්ඩායම විසින් ඔබගේ තොරතුරු පරීක්ෂා කර ඉතා ඉක්මනින් ඔබව සම්බන්ධ කරගනු ඇත.
          </p>
          <button onClick={() => window.location.href = '/'} className="bg-orange-600 text-white font-black py-3 px-8 rounded-xl hover:bg-orange-700 transition-all w-full">
            ආපසු මුල් පිටුවට
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        <div className="bg-zinc-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tight mb-2">
            JOIN OUR NETWORK
          </h2>
          <p className="text-orange-400 font-bold text-sm">
            ගෙදර සිටම ඔබේම ව්‍යාපාරයක් අරඹන්න
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">සම්පූර්ණ නම</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" placeholder="උදා: නාමල් පෙරේරා" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp දුරකථන අංකය</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" placeholder="07XXXXXXXX" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">දිස්ත්‍රික්කය</label>
                <select name="district" value={formData.district} onChange={handleChange} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50 font-medium">
                  <option value="">තෝරන්න...</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ප්‍රා.ලේ. කොට්ඨාසය / නගරය</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" placeholder="උදා: හෝමාගම" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ඔබට වඩාත්ම දක්ෂ මොනවා හදන්නද?</label>
              <textarea name="bestFoods" value={formData.bestFoods} onChange={handleChange} disabled={isSubmitting} rows={2} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" placeholder="උදා: රයිස්, කොත්තු, කේක්, අච්චාරු..."></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ඔබ සතු ඩිලිවරි පහසුකම</label>
              <div className="flex gap-3">
                {['Bike', 'Three-Wheeler', 'No Vehicle'].map((method) => (
                  <button type="button" key={method} disabled={isSubmitting} onClick={() => setFormData({ ...formData, deliveryMethod: method })} className={`flex-1 py-3 px-2 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all ${formData.deliveryMethod === method ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-orange-200'}`}>
                    {method === 'Bike' ? 'බයිසිකලයක් ඇත' : method === 'Three-Wheeler' ? 'ත්‍රීවිල් එකක් ඇත' : 'වාහනයක් නොමැත'}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 text-white font-black py-4 px-4 rounded-xl transition shadow-lg hover:bg-orange-700 disabled:opacity-70 uppercase tracking-widest text-lg">
                {isSubmitting ? 'Sending...' : 'අයදුම්පත යවන්න'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}