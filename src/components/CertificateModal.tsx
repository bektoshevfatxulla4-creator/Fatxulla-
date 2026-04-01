import React from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, Award, Calendar, CheckCircle2, FileText, Download, Printer, ArrowLeft, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { translations, Language } from '../translations';
import { cn } from '../lib/utils';

interface CertificateModalProps {
  product: Product;
  onClose: () => void;
  lang: Language;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ product, onClose, lang }) => {
  const t = translations[lang];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50, rotate: -2 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50, rotate: 2 }}
        className="relative w-full max-w-3xl my-8 overflow-hidden rounded-[1rem] bg-[#fdfdfd] shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] dark:opacity-[0.01]" />

        {/* Stamp Effect */}
        <div className="absolute bottom-24 right-24 opacity-20 pointer-events-none rotate-12">
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-double border-emerald-600 p-2">
            <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-emerald-600 text-center">
              <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-600 leading-none">
                OFFICIAL<br/>HALAL<br/>VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-8 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                if (window.history.state?.modal) window.history.back();
              }}
              className="rounded-2xl bg-slate-100 p-3 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700 sm:hidden"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t.certCompliance}</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400"># {product.certId}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              onClose();
              if (window.history.state?.modal) window.history.back();
            }}
            className="rounded-2xl bg-slate-100 p-3 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Certificate Content */}
        <div className="p-10">
          <div className="relative rounded-[0.5rem] border-[12px] border-double border-slate-100 p-12 dark:border-slate-800">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
              <ShieldCheck className="h-96 w-96" />
            </div>

            <div className="relative space-y-12 text-center">
              <div className="flex justify-center gap-12 opacity-40 grayscale">
                <img src="https://picsum.photos/seed/gimdes/100/100" className="h-20 w-20" />
                <img src="https://picsum.photos/seed/uzst/100/100" className="h-20 w-20" />
              </div>

              <div className="space-y-2">
                <h2 className="text-4xl font-serif font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.certCompliance}</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em]">{t.certComplianceEn}</p>
              </div>

              <div className="space-y-6">
                <p className="text-xl font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  {lang === 'uz' ? "Ushbu hujjat bilan tasdiqlanadiki, quyidagi mahsulot barcha belgilangan" : lang === 'ru' ? "Настоящим документом подтверждается, что следующий продукт соответствует всем установленным стандартам" : "This document confirms that the following product complies with all established"} <span className="font-black text-emerald-600 not-italic">HALAL</span> {lang === 'uz' ? "standartlariga to'liq javob beradi:" : lang === 'ru' ? "стандартам:" : "standards:"}
                </p>
                <div className="py-8 border-y border-slate-50 dark:border-slate-800">
                  <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{product.name}</h1>
                  <p className="mt-3 text-3xl font-bold text-emerald-600 tracking-wide">{product.brand}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-10 gap-x-12 text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.certOwner}</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{product.brand} International</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.certificationBody}</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{product.certificationBody || product.issuer}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.verificationStatus}</span>
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-lg font-bold",
                      product.verificationStatus === 'OFFICIAL_SOURCE' ? "text-blue-600" : 
                      product.verificationStatus === 'AI_VERIFIED' ? "text-emerald-600" : "text-slate-900 dark:text-white"
                    )}>
                      {product.verificationStatus === 'OFFICIAL_SOURCE' ? t.officialSource : 
                       product.verificationStatus === 'AI_VERIFIED' ? t.aiVerified : 
                       product.verificationStatus === 'MANUAL_ENTRY' ? t.manualEntry : t.pending}
                    </p>
                    {product.verificationStatus === 'OFFICIAL_SOURCE' && <ShieldCheck className="h-5 w-5 text-blue-600" />}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.expiry}</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{product.expiry}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.certNumber}</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{product.certId}</p>
                </div>
                {product.verificationSource && (
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.verificationSource}</span>
                    <a 
                      href={product.verificationSource} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline font-bold"
                    >
                      {product.verificationSource}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-center gap-3 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                  <span className="text-2xl font-black uppercase tracking-[0.2em]">{t.verified}</span>
                </div>
                <p className="mt-4 text-xs text-slate-400 italic">{t.certElectronic}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-4 bg-slate-50 p-8 dark:bg-slate-800/50">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-100 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
            <Download className="h-5 w-5" />
            {t.download}
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-100 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
            <Printer className="h-5 w-5" />
            {t.print}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
