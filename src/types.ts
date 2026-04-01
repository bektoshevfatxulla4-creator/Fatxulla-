export interface Product {
  id: string;
  name: string;
  brand: string;
  status: string; // 'Halol', 'Harom', 'Shubhali'
  issuer: string;
  expiry: string;
  image: string;
  description: string;
  ingredients: string[];
  certId: string;
  healthImplications?: string;
  contraindications?: string;
  certificates?: string[];
  verificationSource?: string;
  verificationStatus?: 'AI_VERIFIED' | 'OFFICIAL_SOURCE' | 'MANUAL_ENTRY' | 'PENDING';
  certificationBody?: string;
  lastChecked?: number;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  qrCode: string;
  isActive: boolean;
  subscriptionExpiry: number;
}

export interface CheckIn {
  id: string;
  uid: string;
  storeId: string;
  timestamp: number;
  expiresAt: number;
}
