import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Camera, Package, X, ArrowLeft } from 'lucide-react';
import { translations, Language } from '../translations';

interface RequestFormProps {
  onClose: () => void;
  lang: Language;
}

export const RequestForm: React.FC<RequestFormProps> = ({ onClose, lang }) => {
  const [submitted, setSubmitted] = useState(false);
  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(onClose, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md overflow-hidden rounded-4xl bg-white p-10 shadow-2xl dark:bg-slate-900 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onClose();
                if (window.history.state?.modal) window.history.back();
              }}
              className="rounded-2xl bg-slate-100 p-2.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700 sm:hidden"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t.requestTitle}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t.requestSubtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              onClose();
              if (window.history.state?.modal) window.history.back();
            }} 
            className="rounded-2xl bg-slate-100 p-2.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
              <Send className="h-10 w-10" />
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">{t.requestSuccess}</h4>
            <p className="mt-3 text-slate-500 leading-relaxed dark:text-slate-400">
              {t.requestSuccessDesc}
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-widest dark:text-slate-300">{t.productName}</label>
              <input
                required
                type="text"
                placeholder={t.productNamePlaceholder}
                className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all dark:bg-slate-800 dark:border-slate-800 dark:focus:border-emerald-500 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-widest dark:text-slate-300">{t.brand}</label>
              <input
                required
                type="text"
                placeholder={t.brandPlaceholder}
                className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all dark:bg-slate-800 dark:border-slate-800 dark:focus:border-emerald-500 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="group flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 p-6 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all dark:border-slate-800 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-white shadow-sm transition-colors dark:bg-slate-800 dark:group-hover:bg-slate-700">
                  <Camera className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{t.frontSide}</span>
              </button>
              <button
                type="button"
                className="group flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 p-6 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all dark:border-slate-800 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-white shadow-sm transition-colors dark:bg-slate-800 dark:group-hover:bg-slate-700">
                  <Package className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{t.ingredientsSide}</span>
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="mt-4 w-full rounded-2xl bg-emerald-600 py-5 text-lg font-black text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
            >
              {t.submitRequest}
            </motion.button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};
