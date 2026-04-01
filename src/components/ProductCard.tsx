import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  layoutPrefix?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, isFavorite, onToggleFavorite, layoutPrefix = '' }) => {
  const isHalal = product.status === 'Halol';

  return (
    <motion.div
      layoutId={layoutPrefix ? `${layoutPrefix}-${product.id}` : product.id}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative flex flex-col overflow-hidden rounded-4xl bg-white shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all text-left dark:bg-slate-900 dark:border-slate-800 dark:hover:border-emerald-900/50"
    >
      {/* Product Image Area */}
      <div className="relative h-56 w-full overflow-hidden cursor-pointer" onClick={onClick}>
        <img 
          src={product.image} 
          alt={product.name} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Status Badge Overlay */}
        <div className="absolute left-4 top-4 flex flex-col gap-2">
          <div className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-xl shadow-xl border border-white/20",
            isHalal ? "bg-emerald-500/80" : "bg-amber-500/80"
          )}>
            {isHalal ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {product.status}
          </div>
          
          {product.verificationStatus === 'OFFICIAL_SOURCE' && (
            <div className="flex items-center gap-2 rounded-full bg-blue-500/80 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-xl shadow-xl border border-white/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              VERIFIED
            </div>
          )}
        </div>

        {/* Favorite Button Overlay */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(e);
          }}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xl border border-white/20 hover:bg-white/40 transition-all active:scale-90"
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-red-500 text-red-500")} />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            {product.brand}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            {product.issuer}
          </div>
        </div>
        
        <button onClick={onClick} className="text-left">
          <h4 className="line-clamp-1 text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h4>
        </button>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {[1, 2, 3].map((i) => (
                <div key={`avatar-${i}`} className="h-7 w-7 rounded-full border-2 border-white bg-slate-200 dark:border-slate-900 dark:bg-slate-800 shadow-sm" />
              ))}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              1.2k+ tekshiruv
            </div>
          </div>
          
          <button 
            onClick={onClick}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-500 dark:bg-slate-800"
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
