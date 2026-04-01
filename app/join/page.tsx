'use client';

import { useState } from 'react';
import { db } from '../firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const districts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", 
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", 
  "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", 
  "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

export default function JoinNetwork() {
  const [lang, setLang] = useState('si'); // 'si' for Sinhala, 'en' for English

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
    bestFoods: '',
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
    bestFoods: lang === 'en' ? 'What are you best at cooking? *' : 'ඔබට වඩාත්ම දක්ෂ මොනවා හදන්නද? *',
    bestFoodsPH: lang === 'en' ? 'Eg: Rice, Kottu, Cakes, Pickles...' : 'උදා: රයිස්, කොත්තු, කේක්, අච්චාරු...',
    delivery: lang === 'en' ? 'Your Delivery Method *' : 'ඔබ සතු ඩිලිවරි පහසුකම *',
    bike: lang === 'en' ? 'Have a Bike' : 'බයිසිකලයක් ඇත',
    threeWheel: lang === 'en' ? 'Have a Three-Wheeler' : 'ත්‍රීවිල් එකක් ඇත',
    noVehicle: lang === 'en' ? 'No Vehicle' : 'වාහනයක් නොමැත',
    submitBtn: lang === 'en' ? 'SEND APPLICATION' : 'අයදුම්පත යවන්න',
    sending: lang === 'en' ? 'Sending...' : 'යවමින් පවතී...',
    successTitle: lang === 'en' ? 'Congratulations!' : 'සුබ පැතුම්!',
    successMsg: lang === 'en' ? 'Your application has been successfully submitted. Our team will review your details and contact you soon.' : 'ඔබගේ අයදුම්පත සාර්ථකව අප වෙත ලැබුණි. අපගේ කණ්ඩායම විසින් ඔබගේ තොරතුරු පරීක්ෂා කර ඉතා ඉක්මනින් ඔබව සම්බන්ධ කරගනු ඇත.',
    backBtn: lang === 'en' ? 'Back to Home' : 'ආපසු මුල් පිටුවට',
    alertFill: lang === 'en' ? 'Please fill all required fields.' : 'කරුණාකර අත්‍යවශ්‍ය සියලුම විස්තර නිවැරදිව පුරවන්න.',
    alertMobile: lang === 'en' ? 'Invalid mobile number! Must be 10 digits starting with valid prefix.' : 'ජංගම දුරකථන අංකය වැරදියි! එය 07X න් ආරම්භ වී ඉලක්කම් 10ක් විය යුතුය.',
    alertLand: lang === 'en' ? 'Landline must be 10 digits.' : 'ස්ථාවර දුරකථන අංකයේ ඉලක්කම් 10ක් තිබිය යුතුය.',
    alertEmail: lang === 'en' ? 'Invalid Email Address.' : 'ඊමේල් ලිපිනය වැරදියි.',
    alertNicOld: lang === 'en' ? 'Old NIC must have 9 digits.' : 'පැරණි හැඳුනුම්පත් අංකයේ ඉලක්කම් 9ක් අනිවාර්යයෙන් තිබිය යුතුය.',
    alertNicNew: lang === 'en' ? 'New NIC must have 12 digits.' : 'නව හැඳුනුම්පත් අංකයේ ඉලක්කම් 12ක් අනිවාර්යයෙන් තිබිය යුතුය.',
    alertError: lang === 'en' ? 'Error submitting. Please try again.' : 'අයදුම්පත යැවීමේදී දෝෂයක් මතු විය. කරුණාකර නැවත උත්සාහ කරන්න.'
  };

  const handleNumberOnly = (e: any, field: string, maxLength: number) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    setFormData({ ...formData, [field]: value });
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // 1. හිස්තැන් පරීක්ෂාව (ලිපිනය ද ඇතුළුව)
    if (!formData.fullName || !formData.mobilePhone || !formData.nicNumber || !formData.address || !formData.district || !formData.city || !formData.bestFoods) {
      alert(t.alertFill);
      return;
    }

    // 2. ජංගම දුරකථන පරීක්ෂාව
    const mobileRegex = /^07[01245678]\d{7}$/;
    if (!mobileRegex.test(formData.mobilePhone)) {
      alert(t.alertMobile);
      return;
    }

    // 3. ස්ථාවර දුරකථන පරීක්ෂාව
    if (formData.landPhone && formData.landPhone.length !== 10) {
      alert(t.alertLand);
      return;
    }

    // 4. ඊමේල් පරීක්ෂාව (තිබේ නම් පමණක්)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert(t.alertEmail);
        return;
      }
    }

    // 5. ජාතික හැඳුනුම්පත් පරීක්ෂාව
    if (formData.nicFormat === 'old' && formData.nicNumber.length !== 9) {
      alert(t.alertNicOld);
      return;
    }
    if (formData.nicFormat === 'new' && formData.nicNumber.length !== 12) {
      alert(t.alertNicNew);
      return;
    }

    setIsSubmitting(true);

    try {
      const finalNIC = formData.nicFormat === 'old' 
        ? `${formData.nicNumber}${formData.nicLetter}` 
        : formData.nicNumber;

      await addDoc(collection(db, 'vendor_applications'), {
        fullName: formData.fullName,
        mobilePhone: formData.mobilePhone,
        landPhone: formData.landPhone,
        email: formData.email,
        nic: finalNIC,
        address: formData.address,
        district: formData.district,
        city: formData.city,
        bestFoods: formData.bestFoods,
        deliveryMethod: formData.deliveryMethod,
        appliedLang: lang, // කස්ටමර් පාවිච්චි කරපු භාෂාවත් සේව් කරමු
        status: 'Pending', 
        appliedAt: serverTimestamp(),
      });
      
      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting: ", error);
      alert(t.alertError);
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
          <button onClick={() => window.location.href = '/'} className="bg-orange-600 text-white font-black py-3 px-8 rounded-xl hover:bg-orange-700 transition-all w-full">
            {t.backBtn}
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
          
          {/* Language Switcher */}
          <div className="absolute top-4 right-4 flex gap-1 bg-zinc-800 p-1 rounded-lg">
            <button onClick={() => setLang('si')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${lang === 'si' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>සිංහල</button>
            <button onClick={() => setLang('en')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${lang === 'en' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>EN</button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight mb-2 mt-4">
            {t.title}
          </h2>
          <p className="text-orange-400 font-bold text-sm">
            {t.subtitle}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.name}</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.mobile}</label>
                <input type="tel" value={formData.mobilePhone} onChange={(e) => handleNumberOnly(e, 'mobilePhone', 10)} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" placeholder="07XXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.landline}</label>
                <input type="tel" value={formData.landPhone} onChange={(e) => handleNumberOnly(e, 'landPhone', 10)} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" placeholder="011XXXXXXX" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.email}</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" placeholder="example@gmail.com" />
            </div>

            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
               <label className="block text-sm font-bold text-gray-800 mb-3">{t.nic}</label>
               <div className="flex gap-4 mb-3">
                 <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
                   <input type="radio" name="nicFormat" value="old" checked={formData.nicFormat === 'old'} onChange={handleChange} className="w-4 h-4 text-orange-600 focus:ring-orange-500" />
                   {t.old}
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
                   <input type="radio" name="nicFormat" value="new" checked={formData.nicFormat === 'new'} onChange={handleChange} className="w-4 h-4 text-orange-600 focus:ring-orange-500" />
                   {t.new}
                 </label>
               </div>
               
               {formData.nicFormat === 'old' ? (
                 <div className="flex gap-2">
                   <input type="text" value={formData.nicNumber} onChange={(e) => handleNumberOnly(e, 'nicNumber', 9)} placeholder="123456789" className="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-orange-500 focus:outline-none" />
                   <select name="nicLetter" value={formData.nicLetter} onChange={handleChange} className="border-2 border-gray-300 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-white font-bold w-20 text-center">
                     <option value="V">V</option>
                     <option value="X">X</option>
                   </select>
                 </div>
               ) : (
                 <input type="text" value={formData.nicNumber} onChange={(e) => handleNumberOnly(e, 'nicNumber', 12)} placeholder="19XXXXXXXXXX" className="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-orange-500 focus:outline-none" />
               )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.address}</label>
              <textarea name="address" value={formData.address} onChange={handleChange} disabled={isSubmitting} rows={2} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.district}</label>
                <select name="district" value={formData.district} onChange={handleChange} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50 font-medium">
                  <option value="">{t.select}</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.city}</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} disabled={isSubmitting} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.bestFoods}</label>
              <textarea name="bestFoods" value={formData.bestFoods} onChange={handleChange} disabled={isSubmitting} rows={2} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:outline-none bg-gray-50" placeholder={t.bestFoodsPH}></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.delivery}</label>
              <div className="flex gap-3">
                {['Bike', 'Three-Wheeler', 'No Vehicle'].map((method) => (
                  <button type="button" key={method} disabled={isSubmitting} onClick={() => setFormData({ ...formData, deliveryMethod: method })} className={`flex-1 py-3 px-1 sm:px-2 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all ${formData.deliveryMethod === method ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-orange-200'}`}>
                    {method === 'Bike' ? t.bike : method === 'Three-Wheeler' ? t.threeWheel : t.noVehicle}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 text-white font-black py-4 px-4 rounded-xl transition shadow-lg hover:bg-orange-700 disabled:opacity-70 uppercase tracking-widest text-lg">
                {isSubmitting ? t.sending : t.submitBtn}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}