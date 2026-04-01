import React, { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Search, 
  ScanLine, 
  History, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Bell,
  User as UserIcon,
  ExternalLink,
  Calendar,
  Award,
  ChevronRight,
  Smartphone,
  Database,
  CheckCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowLeft,
  Plus,
  Globe,
  Moon,
  Sun,
  Trash2,
  X,
  Eye,
  Zap,
  Share2,
  Copy,
  Check,
  Store,
  MapPin
} from 'lucide-react';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  onSnapshot, 
  addDoc, 
  query,
  where,
  orderBy,
  Timestamp,
  User as FirebaseUser,
  handleFirestoreError,
  OperationType
} from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Scanner } from './components/Scanner';
import { ProductCard } from './components/ProductCard';
import { RequestForm } from './components/RequestForm';
import { CertificateModal } from './components/CertificateModal';
import { cn } from './lib/utils';
import { Product, Store as StoreType, CheckIn as CheckInType } from './types';
import { translations, Language } from './translations';

// Mock Product Database
const MOCK_PRODUCTS: Product[] = [
  {
    id: '12345',
    name: 'Sutli Shokolad',
    brand: 'Crafers',
    status: 'Halol',
    issuer: 'GIMDES',
    expiry: '2027-01-01',
    image: 'https://picsum.photos/seed/chocolate/400/400',
    description: 'Tabiiy ingredientlardan tayyorlangan yuqori sifatli sutli shokolad.',
    ingredients: ['Shakar', 'Kakao moyi', 'Sut kukuni', 'Kakao massasi', 'Lesitin'],
    certId: 'GIM-UZ-2024-001',
    verificationStatus: 'OFFICIAL_SOURCE',
    certificationBody: 'GIMDES',
    verificationSource: 'https://www.gimdes.org/en'
  },
  {
    id: '67890',
    name: 'Tovuq go\'shti (Muzlatilgan)',
    brand: 'Safi',
    status: 'Halol',
    issuer: 'O\'zstandart',
    expiry: '2025-12-15',
    image: 'https://picsum.photos/seed/chicken/400/400',
    description: 'Shariat talablariga muvofiq so\'yilgan va qayta ishlangan toza tovuq go\'shti.',
    ingredients: ['Tovuq go\'shti'],
    certId: 'UZ-HAL-2025-442',
    verificationStatus: 'OFFICIAL_SOURCE',
    certificationBody: 'O\'zstandart',
    verificationSource: 'https://standart.uz'
  },
  {
    id: '99999',
    name: 'Energetik Ichimlik',
    brand: 'Flash',
    status: 'Shubhali',
    issuer: 'Noma\'lum',
    expiry: '2024-06-01',
    image: 'https://picsum.photos/seed/energy/400/400',
    description: 'Tarkibida shubhali qo\'shimchalar bo\'lishi mumkin bo\'lgan ichimlik.',
    ingredients: ['Suv', 'Shakar', 'Kofein', 'Taurin', 'E120 (Karmun)'],
    certId: 'N/A'
  },
  {
    id: '11111',
    name: 'Asal (Tabiiy)',
    brand: 'Zamin',
    status: 'Halol',
    issuer: 'SMIIC',
    expiry: '2028-05-20',
    image: 'https://picsum.photos/seed/honey/400/400',
    description: 'Tog\'li hududlardan to\'plangan 100% tabiiy asal.',
    ingredients: ['Tabiiy asal'],
    certId: 'SMIIC-UZ-2024-99'
  },
  {
    id: '4780069000130',
    name: 'Coca-Cola Classic',
    brand: 'Coca-Cola',
    status: 'Halol',
    issuer: 'O\'zstandart / GIMDES',
    expiry: '2026-12-31',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop',
    description: 'Klassik tetiklantiruvchi gazlangan ichimlik. Ushbu mahsulot xalqaro sifat va xavfsizlik standartlariga to\'liq javob beradi. O\'zbekistonda ishlab chiqarilgan Coca-Cola mahsulotlari mahalliy va xalqaro halol sertifikatlariga ega.',
    ingredients: ['Gazlangan suv', 'Shakar', 'Bo\'yoq (karamel E150d)', 'Ortofosfat kislotasi', 'Tabiiy aromatizatorlar', 'Kofein'],
    certId: 'UZ-HAL-2024-001 / GIM-2024-CC',
    healthImplications: 'Tarkibida yuqori miqdorda shakar mavjud. Bir shishada (0.5l) taxminan 53g shakar bor, bu kunlik tavsiya etilgan me\'yordan sezilarli darajada yuqori.',
    contraindications: 'Qandli diabet (saxar), semizlik, oshqozon-ichak kasalliklari va kofeinga sezgirligi bor shaxslarga tavsiya etilmaydi.',
    certificates: ['ISO 9001 (Sifat)', 'ISO 22000 (Xavfsizlik)', 'Halol (O\'zstandart)', 'Halol (GIMDES)']
  },
  {
    id: '4780069000178',
    name: 'Fanta Orange',
    brand: 'Fanta',
    status: 'Halol',
    issuer: 'O\'zstandart / GIMDES',
    expiry: '2026-11-20',
    image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?q=80&w=800&auto=format&fit=crop',
    description: 'Apelsin ta\'mli tetiklantiruvchi gazlangan ichimlik. Tabiiy apelsin sharbati qo\'shilgan holda tayyorlangan.',
    ingredients: ['Gazlangan suv', 'Shakar', 'Apelsin sharbati (3%)', 'Limon kislotasi', 'Tabiiy aromatizatorlar', 'Askorbin kislotasi', 'Bo\'yoq (beta-karotin)'],
    certId: 'UZ-HAL-2024-002 / GIM-2024-FO',
    healthImplications: 'Tarkibida shakar mavjud. Ortiqcha iste\'mol qilish tish emaliga va vaznga ta\'sir qilishi mumkin.',
    contraindications: 'Qandli diabet va oshqozon kislotaliligi yuqori bo\'lgan shaxslarga tavsiya etilmaydi.',
    certificates: ['ISO 9001 (Sifat)', 'ISO 22000 (Xavfsizlik)', 'Halol (O\'zstandart)', 'Halol (GIMDES)']
  },
  {
    id: '4780069000086',
    name: 'Bonaqua Still 0.5L',
    brand: 'Bonaqua',
    status: 'Halol',
    issuer: 'O\'zstandart / GIMDES',
    expiry: '2026-12-15',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=800&auto=format&fit=crop',
    description: 'Tabiiy mineral suv, Coca-Cola kompaniyasi tomonidan ishlab chiqarilgan. Ushbu mahsulot eng yuqori sifat standartlariga javob beradi va halol sertifikatiga ega.',
    ingredients: ['Tabiiy mineral suv', 'Kalsiy', 'Magniy', 'Natriy', 'Kaliy'],
    certId: 'UZ-HAL-2024-003 / GIM-2024-BQ',
    healthImplications: 'Sog\'liq uchun foydali, kundalik iste\'mol uchun tavsiya etiladi. Minerallar bilan boyitilgan.',
    contraindications: 'Hech qanday qarshi ko\'rsatmalar mavjud emas.',
    certificates: ['ISO 9001 (Sifat)', 'ISO 22000 (Xavfsizlik)', 'Halol (O\'zstandart)', 'Halol (GIMDES)']
  },
  {
    id: '3228022910023',
    name: 'President Sariyog\' (200g)',
    brand: 'President',
    status: 'Halol',
    issuer: 'HFA (Halal Food Authority) / GIMDES',
    expiry: '2025-10-12',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=800&auto=format&fit=crop',
    description: 'Fransiyaning mashhur President brendidan yuqori sifatli "Beurre Gastronomique" sariyog\'i. 82% yog\'lilik darajasiga ega, tabiiy pasterizatsiya qilingan qaymoqdan tayyorlangan. Ushbu mahsulot xalqaro halol standartlariga to\'liq javob beradi. President mahsulotlari Lactalis kompaniyasi tomonidan ishlab chiqariladi va dunyoning ko\'plab mamlakatlarida halol sertifikatlariga ega.',
    ingredients: ['Pasterizatsiya qilingan qaymoq', 'Sut kislotasi mikroorganizmlari'],
    certId: 'PR-HAL-2024-099 / HFA-82-FR',
    healthImplications: 'Tabiiy A, D, E vitaminlariga boy. Energiya manbai hisoblanadi. Sariyog\' tarkibidagi yog\' kislotalari miya faoliyati va teri holati uchun foydalidir. Biroq, yuqori kaloriyali mahsulot bo\'lgani uchun me\'yorda iste\'mol qilish tavsiya etiladi.',
    contraindications: 'Sut mahsulotlariga (laktoza) allergiyasi bor shaxslarga tavsiya etilmaydi. Xolesterin miqdori yuqori bo\'lgani uchun yurak-qon tomir kasalliklari bor shaxslar ehtiyotkorlik bilan iste\'mol qilishlari lozim.',
    certificates: ['ISO 9001 (Sifat)', 'ISO 22000 (Xavfsizlik)', 'Halol (HFA)', 'Halol (GIMDES)', 'Lactalis Quality Standard']
  }
];

const GUIDES = [
  { title: "Halol nima?", desc: "Shariat ruxsat bergan mahsulotlar.", color: "bg-emerald-50 text-emerald-700" },
  { title: "Haram nima?", desc: "Taqiqlangan mahsulotlar.", color: "bg-red-50 text-red-700" },
  { title: "Mushbooh", desc: "Shubhali mahsulotlar.", color: "bg-amber-50 text-amber-700" }
];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isShowingFullCert, setIsShowingFullCert] = useState(false);
  const [recentScans, setRecentScans] = useState<Product[]>(() => {
    const saved = localStorage.getItem('halal_recent_scans');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved) as Product[];
      // Ensure uniqueness on load
      return parsed.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i).slice(0, 6);
    } catch {
      return [];
    }
  });
  const [cachedProducts, setCachedProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('halal_cached_products');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved) as Product[];
      // Ensure uniqueness on load
      return parsed.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    } catch {
      return [];
    }
  });

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const appUrl = "https://ais-pre-dkrcrwrh3l4ge73un4vvow-68298646217.asia-southeast1.run.app";

  // Handle store query parameter on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('store');
    if (storeId) {
      const checkInFromUrl = async () => {
        try {
          const storeDoc = await getDoc(doc(db, 'stores', storeId));
          if (storeDoc.exists()) {
            const storeData = storeDoc.data() as StoreType;
            const now = Date.now();
            const expiresAt = now + 30 * 60 * 1000; // 30 minutes
            
            const checkIn: CheckInType = {
              id: `${user?.uid || 'anon'}_${now}`,
              uid: user?.uid || 'anonymous',
              storeId: storeId,
              timestamp: now,
              expiresAt: expiresAt
            };
            
            if (user) {
              await setDoc(doc(db, 'checkins', checkIn.id), checkIn);
            }
            
            setCurrentCheckIn(checkIn);
            setActiveStore({ id: storeId, ...storeData });
            localStorage.setItem('halal_checkin', JSON.stringify(checkIn));
            
            // Clear the query parameter from URL
            window.history.replaceState({}, '', window.location.pathname);
            
            // Show success message and open scanner
            setIsScanning(true);
          }
        } catch (err) {
          console.error("Store check-in error from URL", err);
        }
      };
      checkInFromUrl();
    }
  }, [user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear cache and history
  const clearAllData = () => {
    setRecentScans([]);
    setCachedProducts([]);
    localStorage.removeItem('halal_recent_scans');
    localStorage.removeItem('halal_cached_products');
  };
  const [scanError, setScanError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState<Language>('uz');

  // Firebase Auth & Data Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Premium & Scan Limit Logic (Synced with Firestore)
  const [premiumExpiry, setPremiumExpiry] = useState<number | null>(null);
  const [dailyScans, setDailyScans] = useState<{ count: number, date: string }>({ count: 0, date: new Date().toISOString().split('T')[0] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [userScans, setUserScans] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'admin'>('home');
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', address: '', ownerEmail: '', months: 1 });
  const [selectedStore, setSelectedStore] = useState<any>(null);

  const [currentCheckIn, setCurrentCheckIn] = useState<CheckInType | null>(() => {
    const saved = localStorage.getItem('halal_checkin');
    if (saved) {
      try {
        const checkin = JSON.parse(saved) as CheckInType;
        if (Date.now() < checkin.expiresAt) return checkin;
      } catch (e) {
        console.error("Error loading check-in", e);
      }
    }
    return null;
  });
  const [isScanningStore, setIsScanningStore] = useState(false);
  const [activeStore, setActiveStore] = useState<StoreType | null>(null);

  // Check-in expiration check
  useEffect(() => {
    if (!currentCheckIn) return;
    
    const interval = setInterval(() => {
      if (Date.now() > currentCheckIn.expiresAt) {
        setCurrentCheckIn(null);
        setActiveStore(null);
        localStorage.removeItem('halal_checkin');
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [currentCheckIn]);

  // Fetch active store info when check-in changes
  useEffect(() => {
    if (currentCheckIn && !activeStore) {
      getDoc(doc(db, 'stores', currentCheckIn.storeId)).then(docSnap => {
        if (docSnap.exists()) {
          setActiveStore({ id: docSnap.id, ...docSnap.data() } as StoreType);
        }
      });
    }
  }, [currentCheckIn, activeStore]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storeId = params.get('storeId');
    if (storeId) {
      getDoc(doc(db, 'stores', storeId)).then(snapshot => {
        if (snapshot.exists()) {
          setSelectedStore(snapshot.data());
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setPremiumExpiry(null);
      setDailyScans({ count: 0, date: new Date().toISOString().split('T')[0] });
      setIsAdmin(false);
      setUserScans([]);
      setAllPayments([]);
      setAllStores([]);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPremiumExpiry(data.premiumExpiry || null);
        setIsAdmin(data.role === 'admin');
        
        const today = new Date().toISOString().split('T')[0];
        if (data.dailyScans && data.dailyScans.date === today) {
          setDailyScans(data.dailyScans);
        } else {
          setDailyScans({ count: 0, date: today });
        }
      } else {
        const today = new Date().toISOString().split('T')[0];
        setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isPremium: false,
          premiumExpiry: null,
          dailyScans: { count: 0, date: today },
          role: user.email === 'jumanazarovjahongir371@gmail.com' ? 'admin' : 'user'
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    // Listen to user's scans
    const scansQuery = query(collection(db, 'scans'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubscribeScans = onSnapshot(scansQuery, (snapshot) => {
      const scans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setUserScans(scans);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'scans'));

    // Listen to all payments and stores if admin
    let unsubscribePayments = () => {};
    let unsubscribeStores = () => {};
    if (user.email === 'jumanazarovjahongir371@gmail.com') {
      const paymentsQuery = query(collection(db, 'payments'), orderBy('timestamp', 'desc'));
      unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
        const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setAllPayments(payments);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'payments'));

      const storesQuery = query(collection(db, 'stores'), orderBy('createdAt', 'desc'));
      unsubscribeStores = onSnapshot(storesQuery, (snapshot) => {
        const stores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setAllStores(stores);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'stores'));
    }

    return () => {
      unsubscribeUser();
      unsubscribeScans();
      unsubscribePayments();
      unsubscribeStores();
    };
  }, [user]);

  // Seed Optovik Premium store if it doesn't exist
  useEffect(() => {
    if (!isAdmin) return;
    const seedStore = async () => {
      const q = query(collection(db, 'stores'), where('name', '==', 'Optovik Premium'));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        const storeId = 'optovik-premium';
        await setDoc(doc(db, 'stores', storeId), {
          id: storeId,
          name: 'Optovik Premium',
          address: 'Toshkent sh., Chilonzor tumani',
          qrCode: `store:${storeId}`,
          ownerEmail: 'admin@optovik.uz',
          subscriptionExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
          isActive: true,
          createdAt: Date.now()
        });
        console.log("Optovik Premium store seeded.");
      }
    };
    seedStore().catch(console.error);
  }, [isAdmin]);

  const addStore = async () => {
    if (!isAdmin) return;
    try {
      const expiry = Date.now() + (newStore.months * 30 * 24 * 60 * 60 * 1000);
      const storeId = Math.random().toString(36).substring(2, 10);
      await setDoc(doc(db, 'stores', storeId), {
        id: storeId,
        name: newStore.name,
        address: newStore.address,
        qrCode: `store:${storeId}`,
        ownerEmail: newStore.ownerEmail,
        subscriptionExpiry: expiry,
        isActive: true,
        createdAt: Date.now()
      });
      setShowAddStoreModal(false);
      setNewStore({ name: '', address: '', ownerEmail: '', months: 1 });
      alert("Do'kon muvaffaqiyatli qo'shildi!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'stores');
    }
  };

  const isPremium = useMemo(() => {
    if (currentCheckIn && Date.now() < currentCheckIn.expiresAt) return true;
    if (!premiumExpiry) return false;
    return Date.now() < premiumExpiry;
  }, [premiumExpiry, currentCheckIn]);

  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const userPendingPayment = useMemo(() => {
    if (!user) return null;
    return allPayments.find(p => p.uid === user.uid && p.status === 'pending');
  }, [user, allPayments]);

  const buyPremium = async (provider: 'payme' | 'click') => {
    if (!user) {
      loginWithGoogle().catch(console.error);
      return;
    }

    const amount = 15000; // 15,000 UZS
    const userId = user.uid;
    const isDemo = !import.meta.env.VITE_PAYME_MERCHANT_ID && !import.meta.env.VITE_CLICK_SERVICE_ID;

    if (isDemo) {
      alert(lang === 'uz' ? "Demo Rejim: Test to'lov sahifasiga yo'naltirilmoqda..." : "Demo Mode: Redirecting to test payment page...");
    }

    // Create a pending payment record in Firestore so it shows up in Admin Panel
    try {
      await addDoc(collection(db, 'payments'), {
        uid: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        amount,
        currency: 'UZS',
        provider,
        status: 'pending',
        timestamp: Date.now(),
        isDemo
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'payments');
    }

    if (provider === 'payme') {
      const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID || '5af2d241543fca5483e5d930'; // Test Merchant ID
      const params = `m=${merchantId};ac.userId=${userId};a=${amount * 100}`;
      const base64Params = btoa(params);
      window.location.href = `https://checkout.paycom.uz/${base64Params}`;
    } else {
      const serviceId = import.meta.env.VITE_CLICK_SERVICE_ID || '12345'; // Test Service ID
      const merchantId = import.meta.env.VITE_CLICK_MERCHANT_ID || '67890'; // Test Merchant ID
      window.location.href = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${userId}`;
    }

    setShowPremiumModal(false);
  };

  const approvePayment = async (payment: any) => {
    if (!isAdmin) return;
    try {
      // Update payment status
      await setDoc(doc(db, 'payments', payment.id), {
        status: 'completed'
      }, { merge: true });

      // Update user premium status
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      await setDoc(doc(db, 'users', payment.uid), {
        premiumExpiry: expiry,
        isPremium: true
      }, { merge: true });

      alert("To'lov tasdiqlandi!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `payments/${payment.id}`);
    }
  };

  const incrementScanCount = async () => {
    // If user is in a subscribed partner store, scans are FREE
    if (isPremium) return true;
    
    if (dailyScans.count >= 1) {
      setShowPremiumModal(true);
      return false;
    }

    if (user) {
      const nextCount = dailyScans.count + 1;
      const today = new Date().toISOString().split('T')[0];
      try {
        await setDoc(doc(db, 'users', user.uid), {
          dailyScans: { count: nextCount, date: today }
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    } else {
      // For non-logged in users, use local storage as fallback or force login
      setShowPremiumModal(true);
      return false;
    }
    return true;
  };

  const [showGuide, setShowGuide] = useState(() => {
    return !localStorage.getItem('halal_guide_seen');
  });

  const closeGuide = () => {
    setShowGuide(false);
    localStorage.setItem('halal_guide_seen', 'true');
  };

  const [favorites, setFavorites] = useState<Product[]>(() => {
    const saved = localStorage.getItem('halal_favorites');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved) as Product[];
      // Ensure uniqueness on load
      return parsed.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    } catch {
      return [];
    }
  });

  const toggleFavorite = (product: Product) => {
    setFavorites(prev => {
      const isFav = prev.some(p => p.id === product.id);
      const next = isFav ? prev.filter(p => p.id !== product.id) : [product, ...prev];
      localStorage.setItem('halal_favorites', JSON.stringify(next));
      return next;
    });
  };

  const t = translations[lang];

  useEffect(() => {
    const handlePopState = () => {
      if (selectedProduct) {
        setSelectedProduct(null);
        setIsShowingFullCert(false);
      } else if (isScanning) {
        setIsScanning(false);
      } else if (isRequesting) {
        setIsRequesting(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProduct, isScanning, isRequesting]);

  useEffect(() => {
    if (selectedProduct || isScanning || isRequesting) {
      window.history.pushState({ modal: true }, '');
    }
  }, [selectedProduct, isScanning, isRequesting]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    
    // Combine mock products and cached products, prioritizing mock products
    const allProducts = [...MOCK_PRODUCTS];
    
    // Add cached products that aren't already in mock products
    cachedProducts.forEach(cp => {
      if (cp.id && !allProducts.some(mp => mp.id === cp.id)) {
        allProducts.push(cp);
      }
    });
    
    // Final deduplication by ID just in case
    const uniqueProducts = allProducts.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    
    return uniqueProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.brand.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    ).slice(0, 10); // Limit results for performance
  }, [searchQuery, cachedProducts]);

  useEffect(() => {
    localStorage.setItem('halal_cached_products', JSON.stringify(cachedProducts));
  }, [cachedProducts]);

  useEffect(() => {
    localStorage.setItem('halal_recent_scans', JSON.stringify(recentScans));
  }, [recentScans]);

  const [aiSearchStep, setAiSearchStep] = useState<'searching' | 'analyzing'>('searching');

  const fetchProductFromGemini = React.useCallback(async (query: string): Promise<Product | null> => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return null;
    
    // Check cache first
    const cached = cachedProducts.find(p => 
      p.id.toLowerCase() === normalizedQuery || 
      p.name.toLowerCase() === normalizedQuery
    );
    
    if (cached) {
      console.log("Found in cache:", cached.name);
      return cached;
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not defined");
      setScanError(lang === 'uz' ? "Tizim xatosi: API kalit topilmadi." : "System error: API key not found.");
      return null;
    }

    setIsSearchingAI(true);
    setAiSearchStep('searching');
    
    // Check limit before proceeding
    if (!incrementScanCount()) {
      setIsSearchingAI(false);
      return null;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Simulate step change for better UX
      const stepTimer = setTimeout(() => setAiSearchStep('analyzing'), 2000);

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Tezkor qidiruv: "${query}" mahsuloti haqida ma'lumot toping. 
        Halolmi yoki yo'qmi aniqlang. 
        Sertifikat mavjudligini rasmiy manbalardan (GIMDES, SMIIC, HFA, O'zstandart va h.k.) tekshiring.
        Agar aniq sertifikat topilmasa, statusni "Shubhali" deb belgilang.
        JSON formatida qaytaring:
        {
          "name": "nomi",
          "brand": "brend",
          "status": "Halol"|"Harom"|"Shubhali",
          "issuer": "tashkilot",
          "expiry": "muddati",
          "description": "tavsif",
          "ingredients": ["tarkib"],
          "certId": "sertifikat raqami",
          "image": "rasm URL",
          "verificationSource": "sertifikat topilgan rasmiy havola",
          "certificationBody": "sertifikat bergan tashkilot nomi"
        }`,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              brand: { type: Type.STRING },
              status: { type: Type.STRING, enum: ["Halol", "Harom", "Shubhali"] },
              issuer: { type: Type.STRING },
              expiry: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              certId: { type: Type.STRING },
              image: { type: Type.STRING },
              verificationSource: { type: Type.STRING },
              certificationBody: { type: Type.STRING }
            },
            required: ["name", "brand", "status", "description", "ingredients"]
          }
        }
      });

      clearTimeout(stepTimer);
      const text = response.text;
      if (!text) throw new Error("No response from Gemini");

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse Gemini response:", text);
        throw new Error("Invalid response format from AI");
      }

      const newProduct: Product = {
        id: normalizedQuery, // Use normalized query as ID for AI results
        ...data,
        image: data.image || `https://picsum.photos/seed/${encodeURIComponent(data.name)}/400/400`,
        verificationStatus: data.verificationSource ? 'OFFICIAL_SOURCE' : (data.status === 'Shubhali' ? 'PENDING' : 'AI_VERIFIED'),
        lastChecked: Date.now()
      };

      // Save to cache if not already there
      setCachedProducts(prev => {
        const exists = prev.find(p => p.id === newProduct.id);
        if (exists) return prev;
        return [newProduct, ...prev];
      });

      // Save to Firestore History if logged in
      if (user) {
        addDoc(collection(db, 'scans'), {
          uid: user.uid,
          productName: newProduct.name,
          status: newProduct.status.toLowerCase(),
          reason: newProduct.description,
          timestamp: Date.now(),
          image: newProduct.image
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'scans'));
      }

      return newProduct;
    } catch (error: any) {
      console.error("Gemini search error:", error);
      
      let errorMessage = error?.message || "";
      let isQuotaError = false;

      // Try to parse if it's a JSON error string from the API
      try {
        if (typeof errorMessage === 'string' && errorMessage.startsWith('{')) {
          const parsed = JSON.parse(errorMessage);
          if (parsed?.error?.code === 429 || parsed?.error?.status === 'RESOURCE_EXHAUSTED') {
            isQuotaError = true;
          }
        }
      } catch (e) {
        // Not JSON, continue with string checks
      }

      if (!isQuotaError) {
        isQuotaError = errorMessage.includes('429') || 
                       errorMessage.includes('RESOURCE_EXHAUSTED') ||
                       error?.status === 429;
      }

      if (isQuotaError) {
        setScanError(lang === 'uz' 
          ? "AI qidiruv limiti tugadi (Quota exceeded). Iltimos, birozdan so'ng urinib ko'ring yoki qo'lda qidiring." 
          : lang === 'ru'
          ? "Лимит AI поиска исчерпан. Пожалуйста, попробуйте позже или используйте ручной поиск."
          : "AI search limit reached. Please try again later or use manual search.");
      } else if (errorMessage === "No response from Gemini") {
        setScanError(lang === 'uz' ? "AI javob bermadi. Iltimos, qaytadan urinib ko'ring." : "AI did not respond. Please try again.");
      } else {
        setScanError(t.scanError);
      }
      
      return null;
    } finally {
      setIsSearchingAI(false);
    }
  }, [cachedProducts, lang, t.scanError]);

  const handleScan = React.useCallback(async (decodedText: string) => {
    if (!decodedText.trim()) return;
    
    // Vibrate on success if supported
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    let processedText = decodedText.trim();

    // Handle URLs - extract storeId or productId from query params or path
    if (processedText.startsWith('http')) {
      try {
        const url = new URL(processedText);
        const storeId = url.searchParams.get('store');
        const productId = url.searchParams.get('product');
        
        if (storeId) {
          processedText = `store:${storeId}`;
        } else if (productId) {
          processedText = productId;
        } else {
          // If no specific params, maybe the last part of the path is the ID
          const pathParts = url.pathname.split('/').filter(Boolean);
          if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            // Check if it looks like a store ID or product ID
            if (lastPart.length > 5) {
              processedText = lastPart;
            }
          }
        }
      } catch (e) {
        console.error("URL parsing error", e);
      }
    }

    if (isScanningStore) {
      // Handle store check-in
      let storeId = '';
      if (processedText.startsWith('store:')) {
        storeId = processedText.split(':')[1];
      } else if (processedText.length > 5 && !processedText.includes(':')) {
        // If it's just a string like 'optovik-premium', assume it's a store ID
        storeId = processedText;
      }

      if (storeId) {
        try {
          const storeDoc = await getDoc(doc(db, 'stores', storeId));
          if (storeDoc.exists()) {
            const storeData = storeDoc.data() as StoreType;
            const now = Date.now();
            const expiresAt = now + 30 * 60 * 1000; // 30 minutes
            
            const checkIn: CheckInType = {
              id: `${user?.uid || 'anon'}_${now}`,
              uid: user?.uid || 'anonymous',
              storeId: storeId,
              timestamp: now,
              expiresAt: expiresAt
            };
            
            if (user) {
              await setDoc(doc(db, 'checkins', checkIn.id), checkIn);
            }
            
            setCurrentCheckIn(checkIn);
            setActiveStore({ id: storeId, ...storeData });
            localStorage.setItem('halal_checkin', JSON.stringify(checkIn));
            setIsScanningStore(false);
            
            // Immediately re-open scanner for products
            setTimeout(() => {
              setIsScanning(true);
            }, 500);
            return;
          }
        } catch (err) {
          console.error("Store check-in error", err);
        }
      }
      
      setScanError(t.scanError);
      return;
    }

    setIsScanning(false);
    setScanError(null);
    
    // Check mock database
    const localProduct = MOCK_PRODUCTS.find(p => p.id === processedText);
    if (localProduct) {
      setSelectedProduct(localProduct);
      setRecentScans(prev => {
        const filtered = prev.filter(p => p && p.id && p.id !== localProduct.id);
        return [localProduct, ...filtered].slice(0, 10);
      });
      return;
    }

    // Check cache
    const cached = cachedProducts.find(p => p.id === processedText);
    if (cached) {
      setSelectedProduct(cached);
      setRecentScans(prev => {
        const filtered = prev.filter(p => p && p.id && p.id !== cached.id);
        return [cached, ...filtered].slice(0, 10);
      });
      return;
    }

    // If not found, search with Gemini
    const aiProduct = await fetchProductFromGemini(processedText);
    if (aiProduct) {
      setSelectedProduct(aiProduct);
      setRecentScans(prev => {
        const filtered = prev.filter(p => p && p.id && p.id !== aiProduct.id);
        return [aiProduct, ...filtered].slice(0, 10);
      });
      setScanError(null);
    } else {
      // Error is already set in fetchProductFromGemini
    }
  }, [fetchProductFromGemini, cachedProducts, isScanningStore, user, t.scanError]);

  const handleAISearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setScanError(null);
    const aiProduct = await fetchProductFromGemini(searchQuery);
    if (aiProduct) {
      setSelectedProduct(aiProduct);
      setRecentScans(prev => {
        const filtered = prev.filter(p => p && p.id && p.id !== aiProduct.id);
        return [aiProduct, ...filtered].slice(0, 10);
      });
      setSearchQuery('');
    } else {
      // Error is already set in fetchProductFromGemini
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Premium Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-4xl bg-white shadow-2xl dark:bg-slate-900 border border-white/10"
            >
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="absolute right-6 top-6 rounded-xl bg-slate-100 p-2 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-10 text-white text-center relative">
                {(!import.meta.env.VITE_PAYME_MERCHANT_ID && !import.meta.env.VITE_CLICK_SERVICE_ID) && (
                  <div className="absolute top-4 left-4 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20">
                    Demo Mode
                  </div>
                )}
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-xl shadow-xl">
                  <Zap className="h-10 w-10 fill-white" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">{t.premiumTitle}</h2>
                <p className="mt-2 text-amber-50 font-medium opacity-90">{t.premiumDesc}</p>
              </div>
              
              <div className="p-10 space-y-8">
                {userPendingPayment ? (
                  <div className="rounded-2xl bg-amber-50 p-6 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-800">
                      <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-black text-amber-900 dark:text-amber-100">{lang === 'uz' ? "To'lov kutilmoqda" : "Payment Pending"}</h3>
                    <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      {lang === 'uz' ? "Sizning to'lov so'rovingiz ko'rib chiqilmoqda. To'lov tasdiqlanishi bilan Premium faollashadi." : "Your payment request is being reviewed. Premium will be active once payment is confirmed."}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {lang === 'uz' ? "Premium xizmatni faollashtirish uchun to'lov tizimini tanlang:" : "Choose a payment system to activate Premium service:"}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'uz' ? "Kunlik cheksiz AI skanerlash" : "Unlimited AI scanning for 24h"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'uz' ? "Barcha sertifikatlarni ko'rish" : "Access to all certificates"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'uz' ? "Reklamasiz interfeys" : "Ad-free experience"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {!userPendingPayment && (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => buyPremium('payme')}
                        className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white p-4 border-2 border-slate-100 hover:border-emerald-500 transition-all dark:bg-slate-800 dark:border-slate-700"
                      >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Payme_logo.png" className="h-6" alt="Payme" />
                        <span className="text-[10px] font-black text-slate-500">PAYME</span>
                      </button>
                      <button
                        onClick={() => buyPremium('click')}
                        className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white p-4 border-2 border-slate-100 hover:border-blue-500 transition-all dark:bg-slate-800 dark:border-slate-700"
                      >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Click_uz_logo.png/1200px-Click_uz_logo.png" className="h-6" alt="Click" />
                        <span className="text-[10px] font-black text-slate-500">CLICK</span>
                      </button>
                    </div>
                  )}
                  
                  <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {lang === 'uz' ? "Xavfsiz to'lov kafolatlangan" : "Secure payment guaranteed"}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-4xl bg-white p-8 shadow-2xl dark:bg-slate-900 border border-white/10"
            >
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <Share2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {lang === 'uz' ? "Ilovani ulashish" : "Share App"}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {lang === 'uz' ? "Boshqalar ham mahsulotlarni tekshirishlari uchun QR-kodni ulashing" : "Share the QR code so others can check products too"}
                </p>

                <div className="mt-8 flex justify-center rounded-3xl bg-white p-6 shadow-inner dark:bg-white">
                  <QRCodeSVG 
                    value={appUrl} 
                    size={200}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: "https://cdn-icons-png.flaticon.com/512/1042/1042339.png",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-4 font-bold text-slate-900 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                  >
                    {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                    {copied ? (lang === 'uz' ? "Nusxalandi!" : "Copied!") : (lang === 'uz' ? "Havolani nusxalash" : "Copy Link")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-4xl bg-white shadow-2xl dark:bg-slate-900 border border-white/10"
            >
              <div className="bg-emerald-600 p-8 text-white">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl">
                  <ShieldCheck className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">
                  {lang === 'uz' ? "Xush kelibsiz!" : lang === 'ru' ? "Добро пожаловать!" : "Welcome!"}
                </h2>
                <p className="mt-2 text-emerald-50 font-medium">
                  {lang === 'uz' ? "HalolSkanner orqali mahsulotlarni tekshirish bo'yicha qisqa qo'llanma" : "Short guide on how to check products with HalalScanner"}
                </p>
              </div>
              
              <div className="p-8 space-y-6">
                {[
                  { icon: ScanLine, title: lang === 'uz' ? "1. Skanerlang" : "1. Scan", desc: lang === 'uz' ? "Mahsulot qadog'idagi QR-kod yoki shtrix-kodni kameraga ko'rsating." : "Point the camera at the QR code or barcode on the product packaging." },
                  { icon: Search, title: lang === 'uz' ? "2. Qidiring" : "2. Search", desc: lang === 'uz' ? "Agar kod bo'lmasa, mahsulot nomini yozib AI orqali qidiring." : "If there's no code, type the product name and search via AI." },
                  { icon: CheckCircle2, title: lang === 'uz' ? "3. Natija" : "3. Result", desc: lang === 'uz' ? "Tizim mahsulotning halol sertifikati borligini darhol aniqlaydi." : "The system immediately determines if the product has a halal certificate." }
                ].map((step, i) => (
                  <div key={`step-onboarding-${i}`} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-emerald-600 dark:bg-slate-800">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{step.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={closeGuide}
                  className="mt-4 w-full rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  {lang === 'uz' ? "Tushunarli, boshladik!" : "Got it, let's start!"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] dark:bg-emerald-500/10" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] dark:bg-blue-500/10" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 dark:bg-slate-900/80 dark:border-slate-800/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <motion.div 
              whileHover={{ rotate: 10 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20"
            >
              <ShieldCheck className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Halol<span className="text-emerald-600">Skanner</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(['uz', 'ru', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider transition-all",
                    lang === l 
                      ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowShareModal(true)}
              className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 transition-all active:scale-90 dark:text-slate-400 dark:hover:bg-slate-800"
              title={lang === 'uz' ? "Ulashish" : "Share"}
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setShowGuide(true)}
              className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 transition-all active:scale-90 dark:text-slate-400 dark:hover:bg-slate-800"
              title={lang === 'uz' ? "Qo'llanma" : "Guide"}
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            
            {!isPremium && (
              <div className="hidden md:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <ScanLine className="h-3.5 w-3.5" />
                <span>{dailyScans.count}/1</span>
              </div>
            )}

            {isPremium ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] sm:text-xs font-black text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-emerald-500" />
                <span className="hidden xs:inline">{t.premiumActive}</span>
                <span className="xs:hidden">PRO</span>
              </div>
            ) : (
              <button 
                onClick={() => setShowPremiumModal(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-[10px] sm:text-xs font-black text-white hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
              >
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                PREMIUM
              </button>
            )}

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 transition-all active:scale-90 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-100 border-2 border-white shadow-sm dark:bg-slate-800 dark:border-slate-700 active:scale-90 transition-all"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="h-5 w-5 text-slate-500" />
              )}
            </button>

            {isAdmin && (
              <button 
                onClick={() => setActiveTab(activeTab === 'admin' ? 'home' : 'admin')}
                className={cn(
                  "rounded-xl p-2.5 transition-all active:scale-90",
                  activeTab === 'admin' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <Database className="h-5 w-5" />
              </button>
            )}

            <button 
              onClick={() => setActiveTab(activeTab === 'history' ? 'home' : 'history')}
              className={cn(
                "rounded-xl p-2.5 transition-all active:scale-90",
                activeTab === 'history' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              )}
            >
              <History className="h-5 w-5" />
            </button>
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-black text-slate-900 dark:text-white">{user.displayName}</p>
                  <button onClick={() => logout()} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider">
                    {lang === 'uz' ? "Chiqish" : "Logout"}
                  </button>
                </div>
                <img src={user.photoURL || ''} className="h-10 w-10 rounded-xl border-2 border-emerald-500/20" alt="Avatar" />
              </div>
            ) : (
              <button 
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
              >
                <UserIcon className="h-4 w-4" />
                {lang === 'uz' ? "Kirish" : "Login"}
              </button>
            )}

            <button 
              onClick={clearAllData}
              title={lang === 'uz' ? "Keshni tozalash" : lang === 'ru' ? "Очистить кэш" : "Clear cache"}
              className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 transition-all active:scale-90 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {!currentCheckIn && !isAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 rounded-4xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 text-white shadow-2xl shadow-emerald-500/20"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-xl">
                <Store className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-3xl font-black">{t.checkInTitle}</h2>
                <p className="mt-2 text-emerald-50/80 text-lg">{t.checkInDesc}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsScanningStore(true);
                  setIsScanning(true);
                }}
                className="flex items-center gap-3 rounded-2xl bg-white px-8 py-4 font-black text-emerald-700 shadow-xl"
              >
                <ScanLine className="h-6 w-6" />
                {t.scanStoreBtn}
              </motion.button>
            </div>
          </motion.div>
        )}

        {currentCheckIn && (
          <div className="mb-8 flex items-center justify-between rounded-2xl bg-emerald-50 px-6 py-4 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{t.storeName}</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">{activeStore?.name || '...'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.validUntil}</div>
                <div className="text-sm font-black text-emerald-600">
                  {new Date(currentCheckIn.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button 
                onClick={() => {
                  setCurrentCheckIn(null);
                  setActiveStore(null);
                  localStorage.removeItem('halal_checkin');
                }}
                className="p-2 rounded-xl bg-white/50 text-slate-400 hover:text-red-500 transition-all dark:bg-slate-800/50"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {(currentCheckIn || isAdmin) && (
            <motion.div
              key="app-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {activeTab === 'admin' && isAdmin ? (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black tracking-tight">{lang === 'uz' ? "Admin Panel" : "Admin Dashboard"}</h2>
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700">
                <ArrowLeft className="h-4 w-4" /> {lang === 'uz' ? "Orqaga" : "Back"}
              </button>
            </div>

            <div className="grid gap-6 mb-8">
              <div className="rounded-3xl bg-white p-8 shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  {lang === 'uz' ? "To'lov tizimi sozlamalari holati" : "Payment System Config Status"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-sm font-bold">Payme Merchant ID</span>
                    {import.meta.env.VITE_PAYME_MERCHANT_ID ? (
                      <span className="flex items-center gap-1 text-xs font-black text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> SOZLANGAN
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-black text-red-500">
                        <AlertCircle className="h-4 w-4" /> SOZLANMAGAN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-sm font-bold">Click Service ID</span>
                    {import.meta.env.VITE_CLICK_SERVICE_ID ? (
                      <span className="flex items-center gap-1 text-xs font-black text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> SOZLANGAN
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-black text-red-500">
                        <AlertCircle className="h-4 w-4" /> SOZLANMAGAN
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-[10px] text-slate-400 leading-relaxed">
                  {lang === 'uz' 
                    ? "Eslatma: Agar 'SOZLANMAGAN' bo'lsa, tizim test rejimidan foydalanadi. Haqiqiy to'lovlar uchun AI Studio Settings -> Secrets bo'limida kalitlarni o'rnating." 
                    : "Note: If 'NOT CONFIGURED', the system uses test mode. For real payments, set keys in AI Studio Settings -> Secrets."}
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-3xl bg-white p-8 shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold mb-6">{lang === 'uz' ? "Kutilayotgan to'lovlar" : "Pending Payments"}</h3>
                <div className="space-y-4">
                  {allPayments.filter(p => p.status === 'pending').length === 0 ? (
                    <p className="text-slate-500 text-center py-10">{lang === 'uz' ? "Kutilayotgan to'lovlar yo'q" : "No pending payments"}</p>
                  ) : (
                    allPayments.filter(p => p.status === 'pending').map((payment) => (
                      <div key={`pending-${payment.id}`} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">{payment.userName || 'User'}</p>
                          <p className="text-xs text-slate-500">{payment.userEmail}</p>
                          <p className="text-sm font-bold text-emerald-600 mt-1">{payment.amount} {payment.currency}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => approvePayment(payment)}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 transition-all"
                          >
                            {lang === 'uz' ? "Tasdiqlash" : "Approve"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-8 shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Store className="h-5 w-5 text-blue-500" />
                    {lang === 'uz' ? "Do'konlar boshqaruvi" : "Store Management"}
                  </h3>
                  <button 
                    onClick={() => setShowAddStoreModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 transition-all"
                  >
                    <Plus className="h-4 w-4" /> {lang === 'uz' ? "Do'kon qo'shish" : "Add Store"}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-4">{lang === 'uz' ? "Do'kon nomi" : "Store Name"}</th>
                        <th className="pb-4">{lang === 'uz' ? "Obuna muddati" : "Subscription"}</th>
                        <th className="pb-4">{lang === 'uz' ? "QR Kod" : "QR Code"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allStores.map((store) => (
                        <tr key={`store-${store.id}`} className="text-sm">
                          <td className="py-4">
                            <p className="font-bold">{store.name}</p>
                            <p className="text-xs text-slate-500">{store.address}</p>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-black uppercase",
                              Date.now() < store.subscriptionExpiry ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            )}>
                              {new Date(store.subscriptionExpiry).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="bg-white p-1 rounded-lg inline-block border border-slate-100">
                                <QRCodeSVG value={`${appUrl}/?store=${store.id}`} size={40} />
                              </div>
                              <button 
                                onClick={() => setSelectedStore(store)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-8 shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold mb-6">{lang === 'uz' ? "Barcha to'lovlar tarixi" : "Payment History"}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-4">{lang === 'uz' ? "Foydalanuvchi" : "User"}</th>
                        <th className="pb-4">{lang === 'uz' ? "Sana" : "Date"}</th>
                        <th className="pb-4">{lang === 'uz' ? "Summa" : "Amount"}</th>
                        <th className="pb-4">{lang === 'uz' ? "Holat" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allPayments.map((payment) => (
                        <tr key={`history-${payment.id}`} className="text-sm">
                          <td className="py-4">
                            <p className="font-bold">{payment.userName}</p>
                            <p className="text-xs text-slate-500">{payment.userEmail}</p>
                          </td>
                          <td className="py-4 text-slate-500">
                            {new Date(payment.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-4 font-bold">
                            {payment.amount} {payment.currency}
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-black uppercase",
                              payment.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        ) : activeTab === 'history' ? (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black tracking-tight">{lang === 'uz' ? "Skanerlash tarixi" : "Scan History"}</h2>
              <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700">
                <ArrowLeft className="h-4 w-4" /> {lang === 'uz' ? "Orqaga" : "Back"}
              </button>
            </div>

            {userScans.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-4xl border border-dashed border-slate-200 dark:border-slate-800">
                <History className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">{lang === 'uz' ? "Hozircha tarix mavjud emas" : "No history yet"}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userScans.map((scan: any) => (
                  <motion.div
                    key={`scan-${scan.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group cursor-pointer overflow-hidden rounded-3xl bg-white p-4 shadow-lg transition-all hover:shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                    onClick={() => setSelectedProduct(scan)}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl mb-4">
                      <img src={scan.image} className="h-full w-full object-cover transition-transform group-hover:scale-110" alt={scan.productName} referrerPolicy="no-referrer" />
                      <div className={cn(
                        "absolute top-3 right-3 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg",
                        scan.status === 'halol' ? "bg-emerald-500 text-white" : scan.status === 'haram' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                      )}>
                        {scan.status}
                      </div>
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-white truncate">{scan.productName}</h4>
                    <p className="text-xs text-slate-500 mt-1">{new Date(scan.timestamp).toLocaleString()}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Hero Section */}
        <section className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30">
              <Award className="h-4 w-4" />
              <span>{lang === 'uz' ? "O'zbekistondagi ilk rasmiy platforma" : lang === 'ru' ? "Первая официальная платформа в Узбекистане" : "The first official platform in Uzbekistan"}</span>
            </div>
            <h2 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
              {t.heroTitle.split(' ').map((word, i) => (
                word.toLowerCase() === 'halol' || word.toLowerCase() === 'халяль' || word.toLowerCase() === 'halal' 
                ? <span key={`hero-word-${i}`} className="text-gradient italic">{word} </span> 
                : <span key={`hero-word-${i}`}>{word} </span>
              ))}
            </h2>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed dark:text-slate-400">
              {t.heroDesc}
            </p>
            
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsScanning(true)}
                className="group relative flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-emerald-600 px-10 font-bold text-white shadow-2xl shadow-emerald-500/25 transition-all hover:bg-emerald-700 sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <ScanLine className="h-6 w-6 transition-transform group-hover:scale-110" />
                <span className="text-lg">{t.scanBtn}</span>
              </motion.button>
              
              <form onSubmit={handleAISearch} className="relative w-full sm:w-96">
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  className="h-16 w-full rounded-2xl border-2 border-slate-200 bg-white pl-14 pr-6 text-lg outline-none transition-all focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 dark:bg-slate-900 dark:border-slate-800 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 right-0 top-full z-30 mt-4 max-h-96 overflow-y-auto rounded-3xl bg-white/90 p-3 shadow-2xl border border-slate-100 backdrop-blur-xl dark:bg-slate-900/90 dark:border-slate-800"
                    >
                      {filteredProducts.length > 0 ? (
                        <>
                          <div className="mb-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {searchQuery.length > 0 ? t.localDb : t.recent}
                          </div>
                          {filteredProducts.map(product => {
                            const isFromCache = !MOCK_PRODUCTS.some(mp => mp.id === product.id);
                            return (
                              <button
                                key={`search-${product.id}`}
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setSearchQuery('');
                                }}
                                className="group flex w-full items-center gap-4 rounded-2xl p-3 hover:bg-emerald-50 transition-all text-left dark:hover:bg-emerald-900/20"
                              >
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                                  <img src={product.image} className="h-full w-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                                  {isFromCache && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-[1px]">
                                      <div className="rounded-full bg-emerald-500 p-0.5 text-white">
                                        <Globe className="h-2 w-2" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate text-sm font-black text-slate-900 dark:text-white">{product.name}</div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.brand}</div>
                                    {isFromCache && (
                                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">AI</span>
                                    )}
                                  </div>
                                </div>
                                <div className={cn(
                                  "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm",
                                  product.status === 'Halol' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                )}>
                                  {product.status}
                                </div>
                              </button>
                            );
                          })}
                        </>
                      ) : (
                        <div className="py-8 text-center">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 dark:bg-slate-800">
                            <Search className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-400">{t.scanError}</p>
                          <button 
                            onClick={handleAISearch}
                            className="mt-4 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                          >
                            {t.aiSearchBtn}
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleAISearch()}
                        className="mt-2 flex w-full items-center justify-between rounded-2xl bg-emerald-600 p-4 text-left text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                            <Globe className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-black">{t.aiSearchBtn}</div>
                            <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Google Search + Gemini</div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {scanError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-red-50 p-6 border border-red-100 dark:bg-red-900/10 dark:border-red-900/20"
              >
                <div className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  {scanError}
                </div>
                <button
                  onClick={() => setIsRequesting(true)}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-red-600 shadow-sm border border-red-100 hover:bg-red-50 transition-colors dark:bg-slate-900 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Plus className="h-4 w-4" />
                  Mahsulot qo'shishni so'rash
                </button>
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="mb-24">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: t.products, value: "10k+", icon: Database },
              { label: lang === 'uz' ? "Hamkorlar" : lang === 'ru' ? "Партнеры" : "Partners", value: "50+", icon: Globe },
              { label: t.checks, value: "1.2M+", icon: History },
              { label: t.accuracy, value: "100%", icon: ShieldCheck }
            ].map((stat, i) => (
              <motion.div
                key={`stat-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-24">
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{t.howItWorks}</h3>
            <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">{t.howItWorksDesc}</p>
          </div>
          <div className="grid gap-12 sm:grid-cols-3">
            {[
              { icon: Smartphone, title: t.scanStep, desc: t.scanStepDesc },
              { icon: Database, title: t.checkStep, desc: t.checkStepDesc },
              { icon: CheckCircle, title: t.resultStep, desc: t.resultStepDesc }
            ].map((step, i) => (
              <div key={`how-it-works-${i}`} className="relative flex flex-col items-center text-center group">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-emerald-600 shadow-xl shadow-slate-200/50 transition-transform group-hover:-translate-y-2 dark:bg-slate-900 dark:shadow-none dark:border dark:border-slate-800">
                  <step.icon className="h-10 w-10" />
                  <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    {i + 1}
                  </div>
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">{step.title}</h4>
                <p className="mt-3 text-slate-500 leading-relaxed dark:text-slate-400">{step.desc}</p>
                {i < 2 && (
                  <div className="absolute right-[-15%] top-12 hidden w-12 border-t-2 border-dashed border-slate-200 sm:block dark:border-slate-800" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Halal Guide */}
        <section className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.guide}</h3>
            <button className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
              Batafsil <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: t.halalWhat, desc: t.halalDesc, color: "bg-emerald-50 text-emerald-700" },
              { title: t.haramWhat, desc: t.haramDesc, color: "bg-red-50 text-red-700" },
              { title: t.mushbooh, desc: t.mushboohDesc, color: "bg-amber-50 text-amber-700" }
            ].map((guide, i) => (
              <div key={`guide-${i}`} className={cn(
                "rounded-2xl p-6 border border-transparent hover:border-slate-200 transition-all cursor-pointer dark:hover:border-slate-800", 
                guide.color,
                isDarkMode && "bg-slate-900 border-slate-800"
              )}>
                <HelpCircle className="mb-3 h-6 w-6 opacity-50" />
                <h4 className="font-bold dark:text-white">{guide.title}</h4>
                <p className="mt-1 text-sm opacity-80 dark:text-slate-400">{guide.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lang === 'uz' ? "Saqlangan mahsulotlar" : lang === 'ru' ? "Сохраненные продукты" : "Saved Products"}
                </h3>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((product) => (
                <ProductCard 
                  key={`fav-${product.id}`} 
                  product={product} 
                  onClick={() => setSelectedProduct(product)} 
                  isFavorite={true}
                  onToggleFavorite={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product);
                  }}
                  layoutPrefix="fav"
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.recent}</h3>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setRecentScans([])}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                >
                  {lang === 'uz' ? "Tozalash" : lang === 'ru' ? "Очистить" : "Clear"}
                </button>
                <button className="text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                  {lang === 'uz' ? "Hammasini ko'rish" : lang === 'ru' ? "Посмотреть все" : "View all"}
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentScans.map((product) => (
                <ProductCard 
                  key={`recent-${product.id}`} 
                  product={product} 
                  onClick={() => setSelectedProduct(product)} 
                  isFavorite={favorites.some(f => f.id === product.id)}
                  onToggleFavorite={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product);
                  }}
                  layoutPrefix="recent"
                />
              ))}
            </div>
          </section>
        )}

        {/* Certificates Section */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t.partners}</h3>
            <p className="text-slate-500 dark:text-slate-400">
              {lang === 'uz' ? "Biz quyidagi xalqaro va mahalliy sertifikatsiya organlari bilan hamkorlik qilamiz" : lang === 'ru' ? "Мы сотрудничаем со следующими международными и местными органами сертификации" : "We cooperate with the following international and local certification bodies"}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all dark:opacity-30 dark:hover:opacity-100">
            {[
              { name: "GIMDES", logo: "https://picsum.photos/seed/gimdes/100/100" },
              { name: "SMIIC", logo: "https://picsum.photos/seed/smiic/100/100" },
              { name: "O'zstandart", logo: "https://picsum.photos/seed/uzst/100/100" },
              { name: "MUIS", logo: "https://picsum.photos/seed/muis/100/100" },
              { name: "JAKIM", logo: "https://picsum.photos/seed/jakim/100/100" }
            ].map((partner, i) => (
              <div key={`partner-${i}`} className="flex flex-col items-center gap-2">
                <img src={partner.logo} alt={partner.name} className="h-12 w-12 rounded-lg object-contain" referrerPolicy="no-referrer" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{partner.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* App Promo */}
        <section className="rounded-[2.5rem] bg-emerald-900 p-8 text-white sm:p-12 dark:bg-emerald-950">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">{t.promoTitle}</h2>
              <p className="mt-6 text-emerald-100/80 leading-relaxed">
                {t.promoDesc}
              </p>
              <div className="mt-10 flex flex-wrap gap-8">
                <div>
                  <div className="text-3xl font-bold">10k+</div>
                  <div className="text-sm text-emerald-200/60 font-medium">{t.products}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-sm text-emerald-200/60 font-medium">{lang === 'uz' ? "Hamkorlar" : lang === 'ru' ? "Партнеры" : "Partners"}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-sm text-emerald-200/60 font-medium">{t.accuracy}</div>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 rounded-full bg-emerald-400/20 blur-3xl" />
              <img 
                src="https://picsum.photos/seed/app/600/400" 
                alt="App Preview" 
                className="relative rounded-3xl shadow-2xl border-4 border-emerald-800 dark:border-emerald-900"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>
      </>
    )}
            </motion.div>
          )}
        </AnimatePresence>
  </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-12 dark:bg-slate-900 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="col-span-full lg:col-span-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <span className="text-xl font-bold text-emerald-900 dark:text-emerald-400">HalolSkanner</span>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {t.aboutApp}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">{t.app}</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-emerald-600 transition-colors dark:hover:text-emerald-400">{t.howItWorks}</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors dark:hover:text-emerald-400">{t.certDatabase}</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors dark:hover:text-emerald-400">{t.partners}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">{t.company}</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-emerald-600 transition-colors dark:hover:text-emerald-400">{t.aboutUs}</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors dark:hover:text-emerald-400">{t.vacancies}</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors dark:hover:text-emerald-400">{t.contact}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">{t.legal}</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-emerald-600 transition-colors dark:hover:text-emerald-400">{t.privacy}</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors dark:hover:text-emerald-400">{t.terms}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-100 pt-8 text-center text-sm text-slate-400 dark:border-slate-800">
            © 2026 HalolSkanner Startup. {t.rights}
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {isSearchingAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md"
          >
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="h-12 w-12 animate-spin text-emerald-500" />
              </div>
            </div>
            <h3 className="mt-8 text-2xl font-black text-white">
              {aiSearchStep === 'searching' ? t.aiSearching : t.aiAnalyzing}
            </h3>
            <p className="mt-2 text-slate-400 font-medium">
              {aiSearchStep === 'searching' ? (lang === 'uz' ? "Google-dan qidirilmoqda..." : lang === 'ru' ? "Поиск в Google..." : "Searching Google...") : t.aiAnalyzing}
            </p>
          </motion.div>
        )}

        {isScanning && (
          <Scanner 
            onScan={handleScan} 
            onClose={() => {
              setIsScanning(false);
              setIsScanningStore(false);
            }} 
            lang={lang}
            isScanningStore={isScanningStore}
          />
        )}

        {isRequesting && (
          <RequestForm 
            onClose={() => setIsRequesting(false)} 
            lang={lang}
          />
        )}

        {selectedProduct && isShowingFullCert && (
          <CertificateModal 
            product={selectedProduct} 
            onClose={() => setIsShowingFullCert(false)} 
            lang={lang}
          />
        )}

        {/* Add Store Modal */}
        {showAddStoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={() => setShowAddStoreModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black">{lang === 'uz' ? "Yangi do'kon" : "New Store"}</h3>
                <button onClick={() => setShowAddStoreModal(false)} className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    {lang === 'uz' ? "Do'kon nomi" : "Store Name"}
                  </label>
                  <input 
                    type="text"
                    value={newStore.name}
                    onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                    className="w-full rounded-2xl bg-slate-50 p-4 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                    placeholder="Masalan: Makro"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    {lang === 'uz' ? "Manzil" : "Address"}
                  </label>
                  <input 
                    type="text"
                    value={newStore.address}
                    onChange={(e) => setNewStore({...newStore, address: e.target.value})}
                    className="w-full rounded-2xl bg-slate-50 p-4 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                    placeholder="Toshkent sh., Chilonzor"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    {lang === 'uz' ? "Egalik qiluvchi email" : "Owner Email"}
                  </label>
                  <input 
                    type="email"
                    value={newStore.ownerEmail}
                    onChange={(e) => setNewStore({...newStore, ownerEmail: e.target.value})}
                    className="w-full rounded-2xl bg-slate-50 p-4 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                    placeholder="owner@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    {lang === 'uz' ? "Obuna muddati (oy)" : "Subscription (months)"}
                  </label>
                  <select 
                    value={newStore.months}
                    onChange={(e) => setNewStore({...newStore, months: parseInt(e.target.value)})}
                    className="w-full rounded-2xl bg-slate-50 p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                  >
                    <option value={1}>1 {lang === 'uz' ? "oy" : "month"}</option>
                    <option value={3}>3 {lang === 'uz' ? "oy" : "months"}</option>
                    <option value={6}>6 {lang === 'uz' ? "oy" : "months"}</option>
                    <option value={12}>12 {lang === 'uz' ? "oy" : "months"}</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={addStore}
                className="mt-8 w-full rounded-2xl bg-blue-600 py-4 text-lg font-black text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
              >
                {lang === 'uz' ? "Qo'shish" : "Add Store"}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Profile Modal */}
        <AnimatePresence>
          {showProfileModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
              onClick={() => setShowProfileModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl dark:bg-slate-900"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative h-32 bg-gradient-to-r from-emerald-500 to-teal-600">
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="absolute right-6 top-6 rounded-full bg-white/20 p-2 text-white backdrop-blur-md hover:bg-white/30 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="relative px-8 pb-8">
                  <div className="absolute -top-12 left-8 h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-xl dark:border-slate-900 dark:bg-slate-800">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-600">
                        <UserIcon className="h-10 w-10" />
                      </div>
                    )}
                  </div>

                  <div className="pt-16">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {user?.displayName || (lang === 'uz' ? "Foydalanuvchi" : "User")}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">{user?.email}</p>
                    
                    <div className="mt-8 space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                            <Zap className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{lang === 'uz' ? "Obuna holati" : "Subscription Status"}</p>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {isPremium ? (lang === 'uz' ? "Premium Faol" : "Premium Active") : (lang === 'uz' ? "Bepul Rejim" : "Free Plan")}
                            </p>
                          </div>
                        </div>
                        {isPremium && (
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{lang === 'uz' ? "Muddati" : "Expires"}</p>
                            <p className="text-xs font-bold text-emerald-600">{new Date(premiumExpiry!).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => {
                          setActiveTab('history');
                          setShowProfileModal(false);
                        }}
                        className="flex w-full items-center justify-between p-4 rounded-2xl bg-white hover:bg-slate-50 transition-all border border-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <History className="h-5 w-5" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">{lang === 'uz' ? "Skanerlash tarixi" : "Scan History"}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </button>

                      <button 
                        onClick={() => {
                          logout();
                          setShowProfileModal(false);
                        }}
                        className="flex w-full items-center gap-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 dark:hover:bg-red-900/10 dark:hover:border-red-900/20"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                          <ArrowLeft className="h-5 w-5 rotate-180" />
                        </div>
                        <span className="font-bold">{lang === 'uz' ? "Hisobdan chiqish" : "Logout"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Store Info Modal */}
        <AnimatePresence>
          {selectedStore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
              onClick={() => setSelectedStore(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl dark:bg-slate-900"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <Store className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">{selectedStore.name}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lang === 'uz' ? "Tasdiqlangan do'kon" : "Verified Store"}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStore(null)} className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <MapPin className="h-5 w-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{lang === 'uz' ? "Manzil" : "Address"}</p>
                      <p className="font-bold">{selectedStore.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-1" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">{lang === 'uz' ? "Holat" : "Status"}</p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">
                        {Date.now() < selectedStore.subscriptionExpiry 
                          ? (lang === 'uz' ? "Halol Sertifikatlangan" : "Halal Certified")
                          : (lang === 'uz' ? "Muddati o'tgan" : "Subscription Expired")}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-900 text-white text-center">
                    <QRCodeSVG value={`${appUrl}/?store=${selectedStore.id}`} size={120} className="mx-auto mb-4 bg-white p-2 rounded-xl" />
                    <p className="text-xs font-bold opacity-60 uppercase tracking-widest">{lang === 'uz' ? "Do'konning rasmiy QR kodi" : "Official Store QR Code"}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedStore(null)}
                  className="mt-8 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white hover:bg-slate-800 active:scale-95 transition-all dark:bg-white dark:text-slate-900"
                >
                  {lang === 'uz' ? "Tushunarli" : "Got it"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedProduct && !isShowingFullCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={() => {
              setSelectedProduct(null);
              setIsShowingFullCert(false);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl overflow-hidden rounded-t-[2.5rem] bg-white shadow-2xl sm:rounded-[2.5rem] dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-80 w-full">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                
                <button 
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsShowingFullCert(false);
                    if (window.history.state?.modal) window.history.back();
                  }}
                  className="absolute left-6 top-6 rounded-full bg-white/10 p-2 text-white backdrop-blur-xl hover:bg-white/20 transition-all active:scale-90"
                  title={lang === 'uz' ? "Orqaga" : lang === 'ru' ? "Назад" : "Back"}
                >
                  <ArrowLeft className="h-7 w-7" />
                </button>

                <button 
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsShowingFullCert(false);
                    if (window.history.state?.modal) window.history.back();
                  }}
                  className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white backdrop-blur-xl hover:bg-white/20 transition-all active:scale-90"
                >
                  <XCircle className="h-7 w-7" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-3">
                    {selectedProduct.status === 'Halol' ? (
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4" /> {t.halal}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-amber-500/20">
                        <AlertCircle className="h-4 w-4" /> {t.suspicious}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur-xl border border-white/10">
                      <Award className="h-4 w-4" /> {selectedProduct.issuer}
                    </div>
                  </div>
                  <h3 className="mt-4 text-4xl font-black text-white leading-tight">{selectedProduct.name}</h3>
                  <p className="text-lg text-emerald-100/80 font-medium">{selectedProduct.brand}</p>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-8">
                <div className="space-y-8">
                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                        <Info className="h-5 w-5" />
                      </div>
                      {lang === 'uz' ? "Mahsulot haqida" : lang === 'ru' ? "О продукте" : "About product"}
                    </h4>
                    <p className="mt-3 text-slate-600 leading-relaxed dark:text-slate-400">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="rounded-3xl bg-slate-50 p-5 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {t.expiry}
                      </div>
                      <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{selectedProduct.expiry}</div>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <ShieldCheck className="h-4 w-4" />
                        {t.certId}
                      </div>
                      <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">{selectedProduct.certId}</div>
                    </div>
                    
                    <div className="rounded-3xl bg-slate-50 p-5 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <Award className="h-4 w-4" />
                        {t.verificationStatus}
                      </div>
                      <div className={cn(
                        "mt-2 text-lg font-black",
                        selectedProduct.verificationStatus === 'OFFICIAL_SOURCE' ? "text-blue-600" : 
                        selectedProduct.verificationStatus === 'AI_VERIFIED' ? "text-emerald-600" : "text-slate-900 dark:text-white"
                      )}>
                        {selectedProduct.verificationStatus === 'OFFICIAL_SOURCE' ? t.officialSource : 
                         selectedProduct.verificationStatus === 'AI_VERIFIED' ? t.aiVerified : 
                         selectedProduct.verificationStatus === 'MANUAL_ENTRY' ? t.manualEntry : t.pending}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-5 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <Database className="h-4 w-4" />
                        {t.certificationBody}
                      </div>
                      <div className="mt-2 text-lg font-black text-slate-900 dark:text-white truncate">
                        {selectedProduct.certificationBody || selectedProduct.issuer}
                      </div>
                    </div>

                    {selectedProduct.verificationSource && (
                      <div className="col-span-2 rounded-3xl bg-blue-50 p-5 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                          <ExternalLink className="h-4 w-4" />
                          {t.verificationSource}
                        </div>
                        <a 
                          href={selectedProduct.verificationSource} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 block text-sm font-bold text-blue-600 hover:underline break-all"
                        >
                          {selectedProduct.verificationSource}
                        </a>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{t.ingredients}</h4>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {selectedProduct.ingredients.map((ing, i) => (
                        <span key={`ing-${i}`} className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedProduct.healthImplications && (
                    <div className="rounded-3xl bg-amber-50 p-6 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
                      <h4 className="flex items-center gap-2 text-lg font-bold text-amber-900 dark:text-amber-400">
                        <AlertCircle className="h-5 w-5" />
                        {t.healthImpact}
                      </h4>
                      <p className="mt-3 text-amber-800 leading-relaxed dark:text-amber-300/80">
                        {selectedProduct.healthImplications}
                      </p>
                    </div>
                  )}

                  {selectedProduct.contraindications && (
                    <div className="rounded-3xl bg-red-50 p-6 border border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
                      <h4 className="flex items-center gap-2 text-lg font-bold text-red-900 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        {t.notAllowedFor}
                      </h4>
                      <p className="mt-3 text-red-800 leading-relaxed dark:text-red-300/80">
                        {selectedProduct.contraindications}
                      </p>
                    </div>
                  )}

                  {selectedProduct.certificates && (
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">{lang === 'uz' ? "Sertifikatlar" : lang === 'ru' ? "Сертификаты" : "Certificates"}</h4>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        {selectedProduct.certificates.map((cert, i) => (
                          <span key={`cert-${i}`} className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsShowingFullCert(true)}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-5 text-lg font-bold text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                    >
                      <ExternalLink className="h-6 w-6" />
                      {t.fullCert}
                    </motion.button>
                    <p className="mt-6 text-center text-sm font-medium text-slate-400">
                      {lang === 'uz' ? "Ma'lumotlar" : lang === 'ru' ? "Данные" : "Data"} <span className="text-slate-600 dark:text-slate-300 font-bold">{selectedProduct.issuer}</span> {lang === 'uz' ? "tomonidan rasman tasdiqlangan." : lang === 'ru' ? "официально подтверждены." : "officially verified."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
