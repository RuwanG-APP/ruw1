'use client';

import { useState } from 'react';
import { db } from '../firebase'; 
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const districts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", 
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", 
  "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", 
  "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

// කෑම වර්ග සඳහා Checklist එක
const foodCategories = [
  { id: 'rice_curry', en: 'Rice & Curry', si: 'බත් සහ ව්‍යංජන' },
  { id: 'fried_rice', en: 'Fried Rice', si: 'ෆ්‍රයිඩ් රයිස්' },
  { id: 'kottu', en: 'Kottu', si: 'කොත්තු' },
  { id: 'noodles', en: 'Noodles', si: 'නූඩ්ල්ස්' },
  { id: 'paratha', en: 'Paratha / Roti', si: 'පරාටා / රොටි' },
  { id: 'cakes', en: 'Cakes & Sweets', si: 'කේක් සහ රසකැවිලි' },
  { id: 'pickles', en: 'Pickles / Achcharu', si: 'අච්චාරු වර්ග' },
  { id: 'ambul_thiyal', en: 'Ambul Thiyal / Special', si: 'ඇඹුල් තියල් / විශේෂ' }
];

export default function JoinNetwork() {
  const [lang, setLang] = useState('si'); 

  const [formData, setFormData] = useState({
    fullName: '',
    mobilePhone: '',
    landPhone: '',
    email: '',
    nicFormat: 'old', 
    nicNumber: '',
    nicLetter: 'V',   
    address: '',
    district: '',
    city: '', 
    bestFoods: [] as string[], // දැන් මේක Array එකක්
    deliveryMethod: 'Bike',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- පරිවර්තන (Translations) ---
  const t = {
    title: lang === 'en' ? 'JOIN OUR NETWORK' : 'අපගේ ජාලයට එක්වන්න',
    subtitle: lang === 'en' ? 'Start your own food business from home' : 'ගෙදර සිටම ඔබේම ව්‍යාපාරයක් අරඹන්න',
    name: lang === 'en' ? 'Full Name *' : 'සම්පූර්ණ නම *',
    mobile: lang === 'en' ? 'Mobile Phone *' : 'ජංගම දුරකථනය *',
    landline: lang === 'en' ? 'Landline (Optional)' : 'ස්ථාවර දුරකථනය (විකල්ප)',
    email: lang === 'en' ? 'Email Address (Optional)' : 'ඊමේල් ලිපිනය (විකල්ප)',
    nic: lang === 'en' ? 'National Identity Card (NIC) *' : 'ජාතික හැඳුනුම්පත් අංකය (NIC) *',
    old: lang === 'en' ? 'Old' : 'පැරණි',
    new: lang === 'en' ? 'New' : 'නව',
    address: lang === 'en' ? 'Home Address *' : 'නිවසේ ලිපිනය *',
    district: lang === 'en' ? 'District *' : 'දිස්ත්‍රික්කය *',
    select: lang === 'en' ? 'Select...' : 'තෝරන්න...',
    city: lang === 'en' ? 'DS Division / City *' : 'ප්‍රා.ලේ. කොට්ඨාසය / නගරය *',
    bestFoods: lang === 'en' ? 'What can you cook? (Select all that apply) *' : 'ඔබට සෑදිය හැකි කෑම වර්ග තෝරන්න *',
    delivery: lang === 'en' ? 'Your Delivery Method *' : 'ඔබ සතු ඩිලිවරි පහසුකම *',
    bike: lang === 'en' ? 'Bike' : 'බයිසිකලයක් ඇත',
    threeWheel: lang === 'en' ? 'Three-Wheeler' : 'ත්‍රීවිල් එකක් ඇත',
    noVehicle: lang === 'en' ? 'No Vehicle' : 'වාහනයක් නොමැත',
    submitBtn: lang === 'en' ? 'SEND APPLICATION' : 'අයදුම්පත යවන්න',
    sending: lang === 'en' ? 'Checking Security...' : 'පරීක්ෂා කරමින් පවතී...',
    successTitle: lang === 'en' ? 'Congratulations!' : 'සුබ පැතුම්!',
successMsg: lang === 'en' ? 'Your application has been successfully submitted. Our team will review your details and contact you soon.' : 'ඔබගේ අයදුම්පත සාර්ථකව අප වෙත ලැබුණි. අපගේ කණ්ඩායම විසින් ඔබගේ තොරතුරු පරීක්ෂා කර ඉතා ඉක්මනින් ඔබව සම්බන්ධ කරගනු ඇත.',    

    duplicatePhone: lang === 'en' ? 'This Mobile Number is already registered!' : 'මෙම දුරකථන අංකය දැනටමත් ලියාපදිංචි කර ඇත!',
    duplicateNic: lang === 'en' ? 'This NIC Number is already registered!' : 'මෙම හැඳුනුම්පත් අංකය දැනටමත් ලියාපදිංචි කර ඇත!',
    backBtn: lang === 'en' ? 'Back to Home' : 'ආපසු මුල් පිටුවට',
    alertFill: lang === 'en' ? 'Please fill all fields and select at least one food category.' : 'කරුණාකර සියලු විස්තර පුරවා අවම වශයෙන් එක් කෑම වර්ගයක්වත් තෝරන්න.'
  };

  const handleNumberOnly = (e: any, field: string, maxLength: number) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    setFormData({ ...formData, [field]: value });
  };

  const handleFoodToggle = (foodName: string) => {
    const current = [...formData.bestFoods];
    if (current.includes(foodName)) {
      setFormData({ ...formData, bestFoods: current.filter(f => f !== foodName) });
    } else {
      setFormData({ ...formData, bestFoods: [...current, foodName] });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.mobilePhone || !formData.nicNumber || !formData.address || !formData.district || !formData.city || formData.bestFoods.length === 0) {
      alert(t.alertFill);
      return;
    }

    const finalNIC = formData.nicFormat === 'old' ? `${formData.nicNumber}${formData.nicLetter}` : formData.nicNumber;
    
    // --- අපේ ඇප් එකේ Standard Date Format එක සෑදීම (Consistency) ---
    const today = new Date();
    const datePart = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');

    setIsSubmitting(true);

    try {
      // 1. ඩුප්ලිකේට් පරීක්ෂාව (අලුත් field name එක 'phone' ලෙස භාවිතා කර ඇත)
      const qPhone = query(collection(db, 'vendor_applications'), where("phone", "==", formData.mobilePhone));
      const qNic = query(collection(db, 'vendor_applications'), where("nic", "==", finalNIC));

      const [snapPhone, snapNic] = await Promise.all([getDocs(qPhone), getDocs(qNic)]);

      if (!snapPhone.empty) {
        alert(t.duplicatePhone);
        setIsSubmitting(false);
        return;
      }

      if (!snapNic.empty) {
        alert(t.duplicateNic);
        setIsSubmitting(false);
        return;
      }

      // 2. සියල්ල හරි නම් Firebase එකට සේව් කිරීම
      await addDoc(collection(db, 'vendor_applications'), {
        fullName: formData.fullName,
        phone: formData.mobilePhone, // මෙතන 'phone' ලෙස වෙනස් කළා (Consistency)
        landPhone: formData.landPhone,
        email: formData.email,
        nic: finalNIC,
        address: formData.address,
        district: formData.district,
        city: formData.city,
        bestFoods: formData.bestFoods,
        deliveryMethod: formData.deliveryMethod,
        appliedLang: lang,
        status: 'Pending', 
        appliedAt: serverTimestamp(),
        appliedDateOnly: datePart // අලුතින් එකතු කළා (Filtering සඳහා)
      });
      
      setIsSuccess(true);
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-t-8 border-green-500">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">{t.successTitle}</h2>
          <p className="text-gray-600 font-bold mb-6">{t.successMsg}</p>
          <button onClick={() => window.location.href = '/'} className="bg-orange-600 text-white font-black py-3 px-8 rounded-xl hover:bg-orange-700 transition-all w-full">{t.backBtn}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-zinc-900 p-8 text-center relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
          <div className="absolute top-4 right-4 flex gap-1 bg-zinc-800 p-1 rounded-lg">
            <button onClick={() => setLang('si')} className={`px-3 py-1 text-xs font-bold rounded-md ${lang === 'si' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>සිංහල</button>
            <button onClick={() => setLang('en')} className={`px-3 py-1 text-xs font-bold rounded-md ${lang === 'en' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>EN</button>
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic mt-4">{t.title}</h2>
          <p className="text-orange-400 font-bold text-sm">{t.subtitle}</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.name}</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.mobile}</label>
                <input type="tel" value={formData.mobilePhone} onChange={(e) => handleNumberOnly(e, 'mobilePhone', 10)} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" placeholder="07XXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.nic}</label>
                <div className="flex gap-2 mb-2">
                  <label className="text-xs font-bold flex items-center gap-1"><input type="radio" checked={formData.nicFormat === 'old'} onChange={() => setFormData({...formData, nicFormat:'old'})} /> {t.old}</label>
                  <label className="text-xs font-bold flex items-center gap-1"><input type="radio" checked={formData.nicFormat === 'new'} onChange={() => setFormData({...formData, nicFormat:'new'})} /> {t.new}</label>
                </div>
                <div className="flex gap-1">
                  <input type="text" value={formData.nicNumber} onChange={(e) => handleNumberOnly(e, 'nicNumber', formData.nicFormat === 'old' ? 9 : 12)} className="flex-1 border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-orange-500 focus:outline-none bg-gray-50" />
                  {formData.nicFormat === 'old' && (
                    <select value={formData.nicLetter} onChange={(e) => setFormData({...formData, nicLetter: e.target.value})} className="border-2 border-gray-200 rounded-xl p-3 bg-gray-50 font-bold">
                      <option value="V">V</option><option value="X">X</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.address}</label>
              <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} disabled={isSubmitting} rows={2} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.district}</label>
                <select value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50">
                  <option value="">{t.select}</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.city}</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" />
              </div>
            </div>

            {/* Checklist කොටස */}
            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
              <label className="block text-sm font-black text-gray-800 mb-4 uppercase tracking-wider">{t.bestFoods}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {foodCategories.map((food) => (
                  <label key={food.id} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.bestFoods.includes(food.en) ? 'border-orange-500 bg-white shadow-sm' : 'border-gray-100 bg-gray-50/50'}`}>
                    <input type="checkbox" className="w-5 h-5 accent-orange-600 mr-3" checked={formData.bestFoods.includes(food.en)} onChange={() => handleFoodToggle(food.en)} />
                    <span className="text-sm font-bold text-gray-700">{lang === 'en' ? food.en : food.si}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.delivery}</label>
              <div className="flex gap-2">
                {['Bike', 'Three-Wheeler', 'No Vehicle'].map((m) => (
                  <button type="button" key={m} onClick={() => setFormData({...formData, deliveryMethod: m})} className={`flex-1 py-3 px-1 rounded-xl border-2 font-bold text-[10px] sm:text-xs transition-all ${formData.deliveryMethod === m ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500'}`}>
                    {m === 'Bike' ? t.bike : m === 'Three-Wheeler' ? t.threeWheel : t.noVehicle}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-700 disabled:opacity-70 uppercase text-lg tracking-widest">
              {isSubmitting ? t.sending : t.submitBtn}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}