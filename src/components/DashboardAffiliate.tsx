/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, Briefcase, ExternalLink, Heart, Info, 
  Loader2, Mail, Smartphone, MessageCircle, XCircle, ChevronRight, 
  Image as ImageIcon, LayoutDashboard, BarChart3, Users, HelpCircle, 
  Settings, LogOut, Bell, User, CheckSquare, Square, Play, Pause, RotateCcw, Shield
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, query, where, addDoc, deleteDoc, doc, 
  getDocs, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { UserProfile, Offer, CommissionType, UserRole } from '../types';

interface DashboardAffiliateProps {
  userProfile: UserProfile;
  onToggleRole?: () => void;
  onLogout?: () => void;
}

export const DashboardAffiliate: React.FC<DashboardAffiliateProps> = ({ userProfile, onToggleRole, onLogout }) => {
  // Database states
  const [offers, setOffers] = useState<Offer[]>([]);
  const [favoriteOfferIds, setFavoriteOfferIds] = useState<string[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Active view states (Inspired by left sidebar)
  const [activeSection, setActiveSection] = useState<'marketplace' | 'kegemaran' | 'help'>('marketplace');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Focus Timer States (Time Tracker card)
  const [timerSeconds, setTimerSeconds] = useState(0); 
  const [timerRunning, setTimerRunning] = useState(false);

  // Task list for affiliate (Reminders card)
  const [tasks, setTasks] = useState<{ id: number; text: string; completed: boolean }[]>([]);

  // Interactive filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Contact Modal state
  const [contactingOffer, setContactingOffer] = useState<Offer | null>(null);

  // Categories
  const categories = ['Semua', 'Fizikal', 'Digital', 'Servis', 'Makanan', 'Hartanah', 'Pendidikan', 'Kesihatan & Kecantikan', 'Kewangan'];

  // 1. Live timer clock effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // 2. Fetch all active offers from the entire platform
  useEffect(() => {
    const q = query(collection(db, 'offers'), where('status', '==', 'aktif'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOffers: Offer[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedOffers.push({
          id: docSnap.id,
          ownerId: data.ownerId,
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail || '',
          ownerWhatsapp: data.ownerWhatsapp || '',
          ownerTelegram: data.ownerTelegram || '',
          title: data.title,
          description: data.description,
          commissionAmount: Number(data.commissionAmount),
          commissionType: data.commissionType as CommissionType,
          productUrl: data.productUrl,
          category: data.category,
          status: data.status,
          productImageUrl: data.productImageUrl || '',
          contactInstructions: data.contactInstructions || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      // Sort newest first
      fetchedOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setOffers(fetchedOffers);
      setLoadingOffers(false);
    }, (error) => {
      console.error('Error fetching offers:', error);
      setLoadingOffers(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Fetch favorite list
  useEffect(() => {
    const q = query(collection(db, 'favorites'), where('userId', '==', userProfile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((docSnap) => {
        ids.push(docSnap.data().offerId);
      });
      setFavoriteOfferIds(ids);
    }, (error) => {
      console.error('Error fetching favorites:', error);
    });

    return () => unsubscribe();
  }, [userProfile.uid]);

  // Toggle Favorite
  const handleToggleFavorite = async (offerId: string) => {
    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userProfile.uid),
        where('offerId', '==', offerId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        // Delete all matches
        for (const docSnap of snapshot.docs) {
          await deleteDoc(doc(db, 'favorites', docSnap.id));
        }
      } else {
        // Add new
        await addDoc(collection(db, 'favorites'), {
          userId: userProfile.uid,
          offerId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error toggling favorite: ", error);
    }
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Filter offers based on search and category
  const filteredOffers = offers.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || o.category === categoryFilter;
    
    if (activeSection === 'kegemaran') {
      const isFavorite = favoriteOfferIds.includes(o.id);
      return matchesSearch && matchesCategory && isFavorite;
    }
    return matchesSearch && matchesCategory;
  });

  // Prefilled WhatsApp link
  const getWhatsAppLink = (offer: Offer) => {
    const cleanNum = (offer.ownerWhatsapp || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Halo ${offer.ownerName}, saya melihat tawaran komisen anda di REFERRA ("${offer.title}") dan berminat untuk bekerjasama. Boleh kita bincangkan lebih lanjut?`);
    return `https://wa.me/${cleanNum}?text=${text}`;
  };

  // Prefilled Telegram link
  const getTelegramLink = (offer: Offer) => {
    const cleanHandle = (offer.ownerTelegram || '').replace('@', '');
    return `https://t.me/${cleanHandle}`;
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-hidden bg-slate-50 flex" id="komisenhub-affiliate-dashboard-root">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between transform transition-transform duration-300 md:translate-x-0 md:static ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="space-y-7">
          {/* Brand Header */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div 
              onClick={(e) => {
                if (e.detail === 3) {
                  window.location.hash = '#admin';
                }
              }}
              className="flex items-center space-x-3 cursor-pointer select-none"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 block">
                  REFERRA
                </span>
                <span className="text-[8px] font-sans font-bold text-slate-400 uppercase tracking-wide block">ReferralHub</span>
              </div>
            </div>

            {/* Close Button for Mobile */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
              title="Tutup Menu"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="bg-slate-50 border border-slate-200/40 p-3 rounded-xl flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200/60 shrink-0 uppercase">
              {userProfile.displayName?.charAt(0) || <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">{userProfile.displayName}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">{userProfile.email}</p>
            </div>
          </div>

          {/* NAVIGATION MENU */}
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 block mb-2">MENU</span>
              <nav className="space-y-1">
                <button
                  onClick={() => { setActiveSection('marketplace'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeSection === 'marketplace'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center space-x-3">
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>Terokai Tawaran</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeSection === 'marketplace' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {offers.length}
                  </span>
                </button>

                <button
                  onClick={() => { setActiveSection('kegemaran'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeSection === 'kegemaran'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center space-x-3">
                    <Heart className="w-4 h-4 shrink-0" />
                    <span>Tawaran Kegemaran</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeSection === 'kegemaran' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {favoriteOfferIds.length}
                  </span>
                </button>
              </nav>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 block mb-2">GENERAL</span>
              <nav className="space-y-1">
                <button
                  onClick={() => { setActiveSection('help'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeSection === 'help'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>Bantuan & Panduan</span>
                </button>

                {onToggleRole && (
                  <button
                    onClick={onToggleRole}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>Tukar ke Mod Pemilik</span>
                  </button>
                )}

                {/* Admin Button */}
                {userProfile.email === 'rafsha92@gmail.com' && (
                  <button
                    onClick={() => window.location.hash = '#admin'}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 transition-all border border-amber-200/50"
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>Urus Pengguna (Admin)</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Log Keluar Panel</span>
                  </button>
                )}
              </nav>
            </div>
          </div>
        </div>

        {/* Pro Banner Card at sidebar bottom */}
        <div className="mt-8 bg-gradient-to-tr from-emerald-950 to-slate-800 rounded-2xl p-4 text-white relative overflow-hidden shadow-md">
          <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-emerald-500 rounded-full opacity-20"></div>
          <span className="text-[8px] uppercase tracking-wider bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full inline-block font-mono">Affiliate Pro</span>
          <h4 className="text-xs font-bold mt-2 text-white">Sasaran Komisen Tinggi</h4>
          <p className="text-[10px] text-slate-300 mt-1 leading-normal">
            Gunakan teknik penulisan review jujur untuk meningkatkan kadar rujukan produk anda sehingga 40%.
          </p>
          <button 
            onClick={() => setActiveSection('help')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg mt-3 transition-colors text-center"
          >
            Pelajari Strategi
          </button>
        </div>
      </aside>

      {/* Background Overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
        ></div>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP BAR / HEADER */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 sm:px-8 h-16 flex items-center justify-between shadow-xs">
          {/* Left search */}
          <div className="flex items-center space-x-4 flex-1">
            <button 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg md:hidden hover:bg-slate-100"
              title="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <div className="relative max-w-xs w-full hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tawaran atau produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">
                ⌘ F
              </span>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Active role indicator and switcher */}
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider hidden sm:inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Panel Ejen Affiliate
              </span>
              {onToggleRole && (
                <button 
                  onClick={onToggleRole}
                  className="bg-slate-50 border border-slate-200 hover:border-blue-300 text-slate-700 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all hidden sm:block"
                >
                  Tukar Mod Pemilik
                </button>
              )}
            </div>

            {/* Notification bell */}
            <button className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-lg relative" title="Pemberitahuan">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>

            {/* Profile Detail Mini widget */}
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center border border-emerald-200">
                {userProfile.displayName?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{userProfile.displayName}</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Ejen Affiliate</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENTS */}
        <main className="flex-grow p-4 sm:p-8">

          {/* =========================================
              VIEW 1: OVERVIEW (BENTO GRID DESIGN)
              ========================================= */}
          {false && (
            <div className="space-y-6">
              
              {/* Dashboard Title & Actions Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ejen Dashboard</h1>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Terokai, pilih dan mulakan promosi tawaran produk komisen kegemaran anda.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveSection('marketplace')}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all gap-1.5"
                  >
                    <Search className="w-4 h-4" />
                    Cari Tawaran
                  </button>
                  <button
                    onClick={() => setActiveSection('kegemaran')}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Urus Kegemaran
                  </button>
                </div>
              </div>

              {/* STATS SUMMARY (4 Grid Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Stat 1: Main Styled Card (deep green gradient) */}
                <div className="bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-500 text-white p-5 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between h-36">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Jumlah Tawaran Aktif</span>
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <span className="text-4xl font-extrabold block tracking-tight">
                      {loadingOffers ? '...' : offers.length}
                    </span>
                    <span className="text-[10px] text-emerald-100 font-medium mt-1 inline-flex items-center gap-1">
                      <span className="bg-white/20 px-1 py-0.5 rounded font-bold">Baru</span> Peluang jualan meningkat
                    </span>
                  </div>
                </div>

                {/* Stat 2: Favorites Count */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between h-36 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Simpanan Kegemaran</span>
                    <div className="w-7 h-7 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">
                      ♥
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black block text-slate-800 tracking-tight">
                      {favoriteOfferIds.length}
                    </span>
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 inline-block">
                      Tawaran komisen disasarkan
                    </span>
                  </div>
                </div>

                {/* Stat 3: Target Commission Goal */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between h-36 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sasaran Bulanan</span>
                    <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      RM
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-black block text-slate-800 tracking-tight">
                      RM 3,500.00
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold mt-1 inline-block">
                      65% Daripada Sasaran Tercapai
                    </span>
                  </div>
                </div>

                {/* Stat 4: Estimated Traffic (Simulated or helpful tracking) */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between h-36 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Peluang Kolaborasi</span>
                    <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                      ↗
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black block text-slate-800 tracking-tight">
                      {offers.length * 2}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold mt-1 inline-block">
                      Usahawan sedia dihubungi
                    </span>
                  </div>
                </div>
              </div>

              {/* BENTO GRID (Affiliate specific) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. PROJECT ANALYTICS BAR CHART COLUMN */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Purata Kadar Komisen Mengikut Niche</h3>
                      <p className="text-[10px] text-slate-400">Analisis peratusan tawaran komisen pasaran semasa</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">Kategori</span>
                  </div>

                  {/* Visual Bar Chart of niche commissions */}
                  <div className="h-52 flex items-end justify-between pt-4 px-2 relative">
                    <div className="absolute inset-x-0 top-1/4 border-t border-slate-100/80 border-dashed"></div>
                    <div className="absolute inset-x-0 top-2/4 border-t border-slate-100/80 border-dashed"></div>
                    <div className="absolute inset-x-0 top-3/4 border-t border-slate-100/80 border-dashed"></div>

                    <div className="flex flex-col items-center flex-grow">
                      <div className="w-8 sm:w-10 bg-slate-100 hover:bg-emerald-500 rounded-t-lg transition-all h-20 relative group flex items-end justify-center">
                        <div className="w-full bg-slate-200 group-hover:bg-emerald-600 rounded-t-lg h-1/2 transition-all"></div>
                        <span className="absolute -top-6 text-[9px] font-mono text-slate-500">10%</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-2">Fizikal</span>
                    </div>

                    <div className="flex flex-col items-center flex-grow">
                      <div className="w-8 sm:w-10 bg-slate-100 hover:bg-emerald-500 rounded-t-lg transition-all h-40 relative group flex items-end justify-center">
                        <div className="w-full bg-emerald-500 rounded-t-lg h-full relative overflow-hidden">
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:10px_10px]"></div>
                        </div>
                        <span className="absolute -top-7 text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 rounded">Maks 50%</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-800 mt-2">Digital</span>
                    </div>

                    <div className="flex flex-col items-center flex-grow">
                      <div className="w-8 sm:w-10 bg-slate-100 hover:bg-emerald-500 rounded-t-lg transition-all h-28 relative group flex items-end justify-center">
                        <div className="w-full bg-slate-200 group-hover:bg-emerald-600 rounded-t-lg h-2/3 transition-all"></div>
                        <span className="absolute -top-6 text-[9px] font-mono text-slate-500">25%</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-2">Servis</span>
                    </div>

                    <div className="flex flex-col items-center flex-grow">
                      <div className="w-8 sm:w-10 bg-slate-100 hover:bg-emerald-500 rounded-t-lg transition-all h-16 relative group flex items-end justify-center">
                        <div className="w-full bg-slate-200 group-hover:bg-emerald-600 rounded-t-lg h-1/3 transition-all"></div>
                        <span className="absolute -top-6 text-[9px] font-mono text-slate-500">15%</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-2">Makanan</span>
                    </div>

                    <div className="flex flex-col items-center flex-grow">
                      <div className="w-8 sm:w-10 bg-slate-100 hover:bg-emerald-500 rounded-t-lg transition-all h-32 relative group flex items-end justify-center">
                        <div className="w-full bg-slate-200 group-hover:bg-emerald-600 rounded-t-lg h-3/4 transition-all"></div>
                        <span className="absolute -top-6 text-[9px] font-mono text-slate-500">30%</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-2">Pendidikan</span>
                    </div>
                  </div>
                </div>

                {/* 2. REMINDERS / TODO WIDGET COLUMN */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 text-sm">Tugasan Hari Ini</h3>
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-4">Senarai semak pemasaran anda</p>
                    
                    <div className="space-y-3">
                      {tasks.map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => toggleTask(t.id)}
                          className="flex items-center space-x-3 cursor-pointer p-2.5 rounded-xl border border-slate-100/50 hover:bg-slate-50 transition-colors"
                        >
                          {t.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <span className={`text-xs ${t.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-700 font-semibold'}`}>
                            {t.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const text = prompt("Masukkan tugasan pemasaran baru anda:");
                      if (text) {
                        setTasks(prev => [...prev, { id: Date.now(), text, completed: false }]);
                      }
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold py-2 rounded-xl mt-4 transition-colors"
                  >
                    + Tambah Tugasan Baru
                  </button>
                </div>

                {/* 3. BUSINESS OWNERS LIST */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 text-sm">Pemilik Berdaya Hubung</h3>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Pemilik Aktif</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-4">Pemilik perniagaan yang responsif di platform</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center">
                          AS
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Alif Solihin</p>
                          <p className="text-[9px] text-slate-400">Pemilik "Perfume Mewah"</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Sedia</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                          MK
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Meor Khairi</p>
                          <p className="text-[9px] text-slate-400">Pemilik "Servis Coding KL"</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Sedia</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center">
                          SY
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Siti Yasmin</p>
                          <p className="text-[9px] text-slate-400">Pemilik "Buku Bijak Math"</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">Baru</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveSection('community')}
                    className="w-full text-center text-blue-600 hover:text-blue-700 font-bold text-xs mt-4 block"
                  >
                    Lihat Semua &rarr;
                  </button>
                </div>

                {/* 4. GOAL PROGRESS PROGRESS WIDGET */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Pencapaian Komisen</h3>
                    <p className="text-[10px] text-slate-400 mb-4">Nisbah sasaran jualan bulanan ejen anda</p>

                    <div className="flex items-center justify-center py-4 relative">
                      <svg className="w-32 h-32" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-600"
                          strokeDasharray="65, 100"
                          strokeWidth="4"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-black text-slate-800 font-sans">65%</span>
                        <span className="text-[9px] text-slate-400 block font-bold">Tercapai</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-around text-xs border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                      Hasil (RM 2.2k)
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                      Baki (RM 1.3k)
                    </span>
                  </div>
                </div>

                {/* 5. LIVE SESSION TIMER */}
                <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Penjejak Sesi Kerja</h3>
                    <p className="text-[10px] text-slate-400 mb-4">Sesi fokus promosi iklan & rujukan anda</p>

                    <div className="text-center py-3 bg-white/5 border border-white/10 rounded-2xl mb-4">
                      <span className="text-3xl font-mono font-black tracking-widest text-emerald-400 block">
                        {formatTimer(timerSeconds)}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-1 uppercase">Sesi Kerja Aktif</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="flex-1 inline-flex items-center justify-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-colors gap-1.5"
                    >
                      {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {timerRunning ? 'Jeda' : 'Mula Sesi'}
                    </button>
                    <button
                      onClick={() => { setTimerSeconds(0); setTimerRunning(false); }}
                      className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl transition-colors"
                      title="Reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* HIGH RECOMMENDATION OFFERS BLOCK */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:shadow-md transition-all">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Tawaran Komisen Disyorkan Untuk Anda</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Peluang bekerjasama dengan kadar peratusan tinggi minggu ini</p>
                  </div>
                  <button 
                    onClick={() => setActiveSection('marketplace')}
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs"
                  >
                    Teroka Direktori ({offers.length})
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {loadingOffers ? (
                  <div className="text-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  </div>
                ) : offers.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-xs">Tiada tawaran komisen aktif di platform buat masa sekarang.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {offers.slice(0, 3).map((offer) => (
                      <div key={offer.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-50 border border-blue-100/50 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                            {offer.productImageUrl ? (
                              <img src={offer.productImageUrl} alt={offer.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{offer.title}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-medium">{offer.category}</span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-[10px] font-mono text-emerald-600 font-bold">
                                {offer.commissionType === CommissionType.PERCENTAGE ? `${offer.commissionAmount}% Komisen` : `RM ${offer.commissionAmount.toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setContactingOffer(offer)}
                            className="text-[10px] font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            Hubungi Pemilik
                          </button>
                          <button
                            onClick={() => handleToggleFavorite(offer.id)}
                            className={`p-1.5 rounded-lg border ${
                              favoriteOfferIds.includes(offer.id)
                                ? 'bg-rose-50 border-rose-100 text-rose-600'
                                : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${favoriteOfferIds.includes(offer.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* =========================================
              VIEW 2: MARKETPLACE / ALL OFFERS LIST
              ========================================= */}
          {(activeSection === 'marketplace' || activeSection === 'kegemaran') && (
            <div className="space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {activeSection === 'kegemaran' ? 'Tawaran Komisen Kegemaran Anda' : 'Direktori Tawaran Komisen Aktif'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {activeSection === 'kegemaran' 
                    ? 'Senarai tawaran komisen yang anda tandakan untuk dipromosikan kelak.' 
                    : 'Terokai tawaran yang dikemukakan oleh para usahawan secara telus.'}
                </p>
              </div>

              {/* FILTERS & SEARCH BAR */}
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-xs">
                <div className="relative w-full md:max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kata kunci..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto w-full no-scrollbar pb-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all ${
                        categoryFilter === cat
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* DISPLAY GRID LIST */}
              {loadingOffers ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-xs">Memuatkan senarai tawaran...</p>
                </div>
              ) : filteredOffers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Tiada Tawaran Dijumpai</h4>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    {activeSection === 'kegemaran'
                      ? 'Anda belum menetapkan sebarang tawaran sebagai kegemaran anda lagi.'
                      : 'Tiada posting tawaran komisen aktif sepadan dengan kriteria filter carian anda.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOffers.map((offer) => {
                    const isFav = favoriteOfferIds.includes(offer.id);
                    return (
                      <div key={offer.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group">
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            {/* Image banner preview - Full Bleed Card Header */}
                            <div className="w-full h-52 bg-slate-100 overflow-hidden flex items-center justify-center relative">
                              {offer.productImageUrl ? (
                                <img 
                                  src={offer.productImageUrl} 
                                  alt={offer.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                  referrerPolicy="no-referrer" 
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-300 gap-1.5 text-center p-6">
                                  <ImageIcon className="w-8 h-8 text-slate-400 stroke-[1.5]" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">REFERRA</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleToggleFavorite(offer.id)}
                                className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors border backdrop-blur-xs ${
                                  isFav
                                    ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600'
                                    : 'bg-white/95 border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-white'
                                }`}
                                title={isFav ? "Keluarkan Kegemaran" : "Simpan Kegemaran"}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                              </button>
                            </div>

                            <div className="p-5">
                              <div className="flex justify-between items-center mb-3">
                                <span className="bg-blue-50 border border-blue-100/50 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                  {offer.category}
                                </span>
                              </div>

                              <h3 className="text-sm font-extrabold text-slate-900 mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">{offer.title}</h3>
                              <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">{offer.description}</p>

                              {/* Commission box info */}
                              <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1.5 border border-slate-100 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-bold text-[9px] uppercase">Tawaran Komisen</span>
                                  <span className="text-sm font-black text-emerald-600">
                                    {offer.commissionType === CommissionType.PERCENTAGE
                                      ? `${offer.commissionAmount}% Jualan`
                                      : `RM ${offer.commissionAmount.toFixed(2)}`
                                    }
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/30">
                                  <span>Pemilik:</span>
                                  <span className="font-semibold text-slate-700">{offer.ownerName}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="px-5 pb-5 space-y-2">
                            <div className="pt-3 border-t border-slate-100 space-y-2">
                              <a
                                href={offer.productUrl}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all gap-1"
                              >
                                Buka Laman Jualan
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {offer.ownerWhatsapp ? (
                                <a
                                  href={getWhatsAppLink(offer)}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs gap-1.5"
                                >
                                  Hubungi Pemilik Perniagaan
                                </a>
                              ) : (
                                <button
                                  onClick={() => setContactingOffer(offer)}
                                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                                >
                                  Hubungi Pemilik Perniagaan
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* =========================================
              VIEW 3: STATISTICS & REPORT FOR AGENT
              ========================================= */}
          {false && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Analisis Hasil Jualan Saya</h2>
                <p className="text-xs text-slate-500 mt-1">Laporan estimasi komisen yang boleh anda jejak dan rancang.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Sasaran Bulanan</span>
                  <span className="text-2xl font-black text-slate-800 mt-2 block">RM 5,000</span>
                  <p className="text-xs text-slate-500 mt-1">Lagi RM 1,500 untuk mencukupi sasaran</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pautan Dikongsi</span>
                  <span className="text-2xl font-black text-slate-800 mt-2 block">28 Pautan</span>
                  <p className="text-emerald-500 text-xs font-bold mt-1">Active rujukan</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Usahawan Disimpan</span>
                  <span className="text-2xl font-black text-slate-800 mt-2 block">{favoriteOfferIds.length} Usahawan</span>
                  <p className="text-xs text-slate-500 mt-1">Siap sedia untuk dihubungi secara terus</p>
                </div>
              </div>

              {/* Graphic Bar Chart representing earnings progress */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-extrabold text-slate-800 text-sm mb-4">Anggaran Pendapatan Komisen Mingguan (RM)</h3>
                <div className="h-64 flex items-end justify-between pt-6 border-b border-slate-200 pb-2">
                  <div className="w-12 bg-emerald-100 hover:bg-emerald-600 rounded-t-lg h-1/3 transition-all relative flex items-end justify-center">
                    <span className="absolute -top-6 text-[10px] font-mono text-slate-500">RM 150</span>
                  </div>
                  <div className="w-12 bg-emerald-100 hover:bg-emerald-600 rounded-t-lg h-2/3 transition-all relative flex items-end justify-center">
                    <span className="absolute -top-6 text-[10px] font-mono text-slate-500">RM 320</span>
                  </div>
                  <div className="w-12 bg-emerald-600 rounded-t-lg h-5/6 relative flex items-end justify-center">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:10px_10px]"></div>
                    <span className="absolute -top-7 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1 rounded">RM 480 (Kini)</span>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-3 px-2">
                  <span>Minggu 1</span>
                  <span>Minggu 2</span>
                  <span>Minggu 3 (Semasa)</span>
                </div>
              </div>
            </div>
          )}


          {/* =========================================
              VIEW 4: BUSINESS OWNER DIRECTORY LIST
              ========================================= */}
          {false && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Senarai Pemilik Perniagaan Berdaftar</h2>
                <p className="text-xs text-slate-500 mt-1">Berhubung terus dengan pengasas perniagaan untuk mendapatkan pautan affiliate tersuai atau kod diskaun.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100">
                      AS
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Alif Solihin</h4>
                      <p className="text-[10px] text-slate-400">Pengasas Perfume Wangi Sdn Bhd</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    "Kami sedia membekalkan ejen pemasaran kami dengan kit pengiklanan lengkap (gambar, video, copy jualan). Komisen dibayar setiap hari Jumaat secara konsisten."
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Melaka, MY</span>
                    <span className="text-emerald-600 font-bold">Responsif Serta-merta</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 font-bold flex items-center justify-center border border-orange-100">
                      MK
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Meor Khairi</h4>
                      <p className="text-[10px] text-slate-400">Pemilik Servis Coding KL</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    "Tawaran komisen RM 200 tetap untuk setiap klien berjaya yang merujuk servis pembinaan aplikasi web kami. Sokongan teknikal disediakan penuh untuk memukau pelanggan."
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Kuala Lumpur, MY</span>
                    <span className="text-emerald-600 font-bold">Sedia Berbincang</span>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* =========================================
              VIEW 5: HELP CENTER
              ========================================= */}
          {activeSection === 'help' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Pusat Bantuan & Strategi Ejen</h2>
                <p className="text-xs text-slate-500 mt-1">Panduan praktikal untuk memaksimumkan hasil komisen pemasaran anda.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="font-bold text-slate-800 text-xs">Apakah langkah pertama selepas mendaftar?</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Cari produk yang sesuai dengan niche pemasaran anda (contohnya Fizikal atau Pendidikan) di dalam direktori. Seterusnya klik butang "Hubungi Pemilik Perniagaan" untuk berhubung terus melalui WhatsApp atau Telegram untuk bersetuju mengenai kaedah tracking dan kaedah perkongsian hasil jualan.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="font-bold text-slate-800 text-xs">Bagaimana jika pemilik perniagaan tidak membayar komisen?</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    REFERRA ialah platform maklumat direktori bertulis sahaja. Kami tiada penglibatan undang-undang atau kawalan pembayaran di luar sistem. Oleh itu, kami amat mengesyorkan agar bekerjasama dengan pemilik perniagaan yang mempunyai rekod prestasi bereputasi tinggi atau bersetuju dengan tempoh bayaran yang singkat (seperti bayaran mingguan).
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* =========================================
          CONTACT BUSINESS OWNER MODAL (FULLY RE-STYLED)
          ========================================= */}
      {contactingOffer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900">
                Hubungi Pemilik Perniagaan
              </h3>
              <button
                onClick={() => setContactingOffer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Tawaran Terpilih</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{contactingOffer.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Milik {contactingOffer.ownerName}</p>
              </div>

              {contactingOffer.contactInstructions && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs">
                  <span className="font-bold text-amber-800 block uppercase tracking-wider text-[8px] mb-0.5">Arahan Cara Hubungi:</span>
                  <p className="text-amber-900 leading-normal whitespace-pre-line text-[11px]">{contactingOffer.contactInstructions}</p>
                </div>
              )}

              {/* Contacts buttons */}
              <div className="space-y-2.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Saluran Hubungan Terus:</span>
                
                {contactingOffer.ownerWhatsapp ? (
                  <a
                    href={getWhatsAppLink(contactingOffer)}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-100 transition-all font-semibold text-xs gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                      Hubungi via WhatsApp
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono sm:text-right">
                      {contactingOffer.ownerWhatsapp}
                    </span>
                  </a>
                ) : (
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 text-xs flex items-center gap-2">
                    <Smartphone className="w-4 h-4 shrink-0" />
                    WhatsApp tidak disediakan
                  </div>
                )}

                {contactingOffer.ownerTelegram ? (
                  <a
                    href={getTelegramLink(contactingOffer)}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl border border-sky-100 transition-all font-semibold text-xs gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-sky-600 shrink-0" />
                      Hubungi via Telegram
                    </span>
                    <span className="text-[10px] text-sky-600 font-mono sm:text-right">
                      {contactingOffer.ownerTelegram}
                    </span>
                  </a>
                ) : (
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 text-xs flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    Telegram tidak disediakan
                  </div>
                )}

                {contactingOffer.ownerEmail ? (
                  <a
                    href={`mailto:${contactingOffer.ownerEmail}?subject=Kerjasama REFERRA: ${encodeURIComponent(contactingOffer.title)}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-100 transition-all font-semibold text-xs gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                      Hubungi via E-mel
                    </span>
                    <span className="text-[10px] text-blue-600 font-mono truncate max-w-full sm:max-w-[200px] sm:text-right">
                      {contactingOffer.ownerEmail}
                    </span>
                  </a>
                ) : null}
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  onClick={() => setContactingOffer(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors"
                >
                  Tutup Paparan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
