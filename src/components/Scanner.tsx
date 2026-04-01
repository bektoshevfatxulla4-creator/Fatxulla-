import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, ShieldCheck, Zap, Keyboard, Search, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from '../translations';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  lang: Language;
  isScanningStore?: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose, lang, isScanningStore }) => {
  const [manualId, setManualId] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const t = translations[lang];
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      const element = document.getElementById("reader");
      if (!element) return;

      html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 30,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              // Larger box for better scanning
              const size = Math.floor(minEdge * 0.8);
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            // Silently handle scan errors
          }
        );
        setIsCameraActive(true);
        setError(null);

        // Check for flashlight support
        const track = (html5QrCode as any).getRunningTrack();
        if (track) {
          const capabilities = track.getCapabilities() as any;
          if (capabilities.torch) {
            setHasFlash(true);
          }
        }
      } catch (err: any) {
        console.error("Kamerani ishga tushirib bo'lmadi:", err);
        let errorMsg = lang === 'uz' ? "Kameraga ruxsat berilmagan yoki kamera topilmadi." : lang === 'ru' ? "Доступ к камере запрещен или камера не найдена." : "Camera access denied or camera not found.";
        
        if (err.name === 'NotAllowedError' || err.toString().includes('Permission denied')) {
          errorMsg = lang === 'uz' 
            ? "Kameraga ruxsat berilmagan. Iltimos, brauzer sozlamalarida kameraga ruxsat bering va qaytadan urinib ko'ring." 
            : lang === 'ru' 
            ? "Доступ к камере запрещен. Пожалуйста, разрешите доступ в настройках браузера и попробуйте снова." 
            : "Camera access denied. Please grant permission in your browser settings and try again.";
        }
        
        setError(errorMsg);
        setIsCameraActive(false);
      }
    };

    if (!showManual) {
      startScanner();
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((err) => console.error('Failed to stop scanner', err));
      }
    };
  }, [onScan, showManual, lang, retryTrigger]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      onScan(manualId.trim());
    }
  };

  const toggleFlash = async () => {
    if (!html5QrCodeRef.current || !hasFlash) return;
    
    try {
      const newFlashState = !isFlashOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: newFlashState }]
      } as any);
      setIsFlashOn(newFlashState);
    } catch (err) {
      console.error("Flashlight error:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/98 p-4 backdrop-blur-2xl"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-4xl bg-white shadow-2xl dark:bg-slate-900 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-8 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onClose();
                if (window.history.state?.modal) window.history.back();
              }}
              className="rounded-2xl bg-slate-100 p-3 text-slate-500 transition-all hover:bg-slate-200 active:scale-90 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 sm:hidden"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {isScanningStore ? t.checkInTitle : t.scanTitle}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isScanningStore ? (lang === 'uz' ? "Do'konni tasdiqlash" : "Подтверждение магазина") : "AI-quvvatlangan aniqlash"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              if (window.history.state?.modal) window.history.back();
            }}
            className="rounded-2xl bg-slate-100 p-3 text-slate-500 transition-all hover:bg-slate-200 active:scale-90 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {!showManual ? (
              <motion.div
                key="camera"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="relative aspect-square overflow-hidden rounded-4xl border-4 border-emerald-500/10 bg-slate-950">
                  <div id="reader" className="w-full h-full"></div>
                  
                  {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 p-6 text-center z-10">
                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                        <AlertCircle className="h-8 w-8" />
                      </div>
                      <h3 className="mb-2 text-lg font-black text-white">
                        {lang === 'uz' ? "Kamera xatosi" : lang === 'ru' ? "Ошибка камеры" : "Camera Error"}
                      </h3>
                      <p className="text-sm font-medium text-slate-300 leading-relaxed">{error}</p>
                      <div className="mt-8 flex w-full flex-col gap-3">
                        <button 
                          onClick={() => setRetryTrigger(prev => prev + 1)}
                          className="w-full rounded-2xl bg-emerald-500 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all"
                        >
                          {lang === 'uz' ? "Qayta urinish" : lang === 'ru' ? "Попробовать снова" : "Try Again"}
                        </button>
                        <button 
                          onClick={() => setShowManual(true)}
                          className="w-full rounded-2xl bg-white/10 py-4 text-sm font-black text-white hover:bg-white/20 transition-all"
                        >
                          {t.manualInput}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scanning Overlay UI */}
                  {isCameraActive && !error && (
                    <>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-72 w-72 rounded-4xl border-2 border-emerald-500/30 shadow-[0_0_0_100vmax_rgba(2,6,23,0.7)]">
                          {/* Corner Accents */}
                          <div className="absolute -left-1 -top-1 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                          <div className="absolute -right-1 -top-1 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                          <div className="absolute -bottom-1 -left-1 h-12 w-12 rounded-bl-3xl border-l-4 border-b-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                          <div className="absolute -bottom-1 -right-1 h-12 w-12 rounded-br-3xl border-r-4 border-b-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                          
                          {/* Moving Scan Line */}
                          <motion.div 
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(16,185,129,1)]"
                          />
                        </div>
                      </div>

                      {hasFlash && (
                        <button
                          onClick={toggleFlash}
                          className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-xl transition-all active:scale-90 ${
                            isFlashOn 
                              ? 'bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/40' 
                              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          <Zap className={`h-6 w-6 ${isFlashOn ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-8 flex items-center gap-4 rounded-3xl bg-emerald-50/50 p-5 text-emerald-700 border border-emerald-100/50 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold leading-tight">
                    {isScanningStore ? t.checkInDesc : t.scanHint}
                  </p>
                </div>

                <button
                  onClick={() => setShowManual(true)}
                  className="mt-6 w-full rounded-2xl border-2 border-slate-100 py-4 font-bold text-slate-500 hover:bg-slate-50 transition-all dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {t.manualInput}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="manual"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest dark:text-slate-300">{t.manualLabel}</label>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder={t.manualPlaceholder}
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      className="h-14 flex-1 rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 text-lg font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all dark:bg-slate-800 dark:border-slate-800 dark:focus:border-emerald-500 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="h-14 rounded-2xl bg-emerald-600 px-6 font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                    >
                      {t.checkBtn}
                    </button>
                  </form>
                </div>
                
                <div className="rounded-3xl bg-blue-50/50 p-5 text-blue-700 border border-blue-100/50 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20">
                  <p className="text-sm font-bold leading-relaxed">
                    {lang === 'uz' ? "Mahsulot qadog'idagi QR-kod ostida yoki shtrix-kod yonida joylashgan raqamlarni kiriting." : lang === 'ru' ? "Введите цифры, расположенные под QR-кодом или рядом со штрих-кодом на упаковке продукта." : "Enter the numbers located under the QR code or next to the barcode on the product packaging."}
                  </p>
                </div>

                <button
                  onClick={() => setShowManual(false)}
                  className="w-full rounded-2xl border-2 border-slate-100 py-4 font-bold text-slate-500 hover:bg-slate-50 transition-all dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {t.backToCamera}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-xl border border-white/10">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-sm font-bold text-slate-300">{lang === 'uz' ? "Tizim faol" : lang === 'ru' ? "Система активна" : "System active"}</span>
        </div>
      </div>
    </motion.div>
  );
};
