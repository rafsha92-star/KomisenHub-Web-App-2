/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Briefcase, DollarSign, CheckCircle, 
  Trash2, AlertCircle, FileText, Info, Loader2, Send, 
  ExternalLink, Smartphone, MessageCircle, Mail, Upload, Image as ImageIcon,
  Pencil, Users, Clock, Play, Pause, RotateCcw, LayoutDashboard, BarChart3, 
  HelpCircle, Settings, LogOut, ChevronRight, CheckSquare, Square, Bell, User, Shield, XCircle
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, addDoc, updateDoc, doc, 
  onSnapshot, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { UserProfile, Offer, CommissionType, UserRole } from '../types';

interface DashboardOwnerProps {
  userProfile: UserProfile;
  onToggleRole?: () => void;
  onLogout?: () => void;
  onShowStatus: (type: 'loading' | 'success' | 'error', title: string, message: string, autoCloseMs?: number) => void;
}

export const DashboardOwner: React.FC<DashboardOwnerProps> = ({ 
  userProfile, 
  onToggleRole, 
  onLogout,
  onShowStatus
}) => {
  // State management
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  
  // Navigation states (Inspired by sidebar)
  const [activeSection, setActiveSection] = useState<'offers' | 'create_offer' | 'help'>('offers');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Focus Timer States (Time Tracker card)
  const [timerSeconds, setTimerSeconds] = useState(0); 
  const [timerRunning, setTimerRunning] = useState(false);

  // Checklist for Owner tasks (Reminders card)
  const [tasks, setTasks] = useState<{ id: number; text: string; completed: boolean }[]>([]);

  // Create offer form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Servis');
  const [commissionAmount, setCommissionAmount] = useState(10);
  const [commissionType, setCommissionType] = useState<CommissionType>(CommissionType.PERCENTAGE);
  const [productUrl, setProductUrl] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [contactInstructions, setContactInstructions] = useState('');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Categories
  const categories = ['Fizikal', 'Digital', 'Servis', 'Makanan', 'Hartanah', 'Pendidikan', 'Kesihatan & Kecantikan', 'Kewangan'];

  // 1. Live clock effect
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

  // 2. Fetch Owner's own Offers
  useEffect(() => {
    const path = 'offers';
    try {
      const q = query(collection(db, path), where('ownerId', '==', userProfile.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedOffers: Offer[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedOffers.push({
            id: docSnap.id,
            ownerId: data.ownerId,
            ownerName: data.ownerName,
            ownerEmail: data.ownerEmail || userProfile.email,
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
        
        // Sort by newest first
        fetchedOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setOffers(fetchedOffers);
        setLoadingOffers(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error in fetching offers: ', error);
      setLoadingOffers(false);
    }
  }, [userProfile.uid, userProfile.email]);

  // Helper to open modal for creation
  const handleOpenCreateModal = () => {
    setEditingOfferId(null);
    setTitle('');
    setDescription('');
    setCategory('Servis');
    setCommissionAmount(10);
    setCommissionType(CommissionType.PERCENTAGE);
    setProductUrl('');
    setProductImageUrl('');
    setContactInstructions('');
    setOwnerWhatsapp(userProfile.whatsapp || '');
    setOwnerEmail(userProfile.email || '');
    setErrorMsg('');
    setActiveSection('create_offer');
  };

  // Helper to open modal for editing
  const handleOpenEditModal = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setTitle(offer.title);
    setDescription(offer.description);
    setCategory(offer.category);
    setCommissionAmount(offer.commissionAmount);
    setCommissionType(offer.commissionType);
    setProductUrl(offer.productUrl);
    setProductImageUrl(offer.productImageUrl || '');
    setContactInstructions(offer.contactInstructions || '');
    setOwnerWhatsapp(offer.ownerWhatsapp || '');
    setOwnerEmail(offer.ownerEmail || offer.ownerEmail || '');
    setErrorMsg('');
    setActiveSection('create_offer');
  };

  const handleImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Sila pilih fail gambar sahaja (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 500000) {
      alert('Sila pilih gambar bersaiz kecil (kurang daripada 500KB) untuk prestasi terbaik.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProductImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !productUrl || commissionAmount <= 0) {
      setErrorMsg('Sila isi semua ruangan bertanda * dengan lengkap.');
      return;
    }

    setSubmittingOffer(true);
    setErrorMsg('');

    if (editingOfferId) {
      onShowStatus('loading', 'Mengemas Kini Tawaran...', 'Sila tunggu sebentar, maklumat tawaran anda sedang disimpan...');
    } else {
      onShowStatus('loading', 'Menyimpan Tawaran Baru...', 'Sila tunggu sebentar, tawaran komisen anda sedang didaftarkan...');
    }

    const path = 'offers';
    try {
      if (editingOfferId) {
        const offerRef = doc(db, 'offers', editingOfferId);
        await updateDoc(offerRef, {
          title,
          description,
          commissionAmount: Number(commissionAmount),
          commissionType,
          productUrl,
          category,
          productImageUrl: productImageUrl || '',
          contactInstructions,
          ownerWhatsapp: ownerWhatsapp || '',
          ownerEmail: ownerEmail || '',
          updatedAt: serverTimestamp(),
        });
        setEditingOfferId(null);
        onShowStatus('success', 'Tawaran Dikemaskini!', 'Maklumat tawaran anda telah dikemaskini dengan selamat.', 2500);
      } else {
        const newOfferData = {
          ownerId: userProfile.uid,
          ownerName: userProfile.displayName,
          ownerEmail: ownerEmail || userProfile.email || '',
          ownerWhatsapp: ownerWhatsapp || userProfile.whatsapp || '',
          ownerTelegram: userProfile.telegram || '',
          title,
          description,
          commissionAmount: Number(commissionAmount),
          commissionType,
          productUrl,
          category,
          status: 'aktif',
          productImageUrl: productImageUrl || '',
          contactInstructions,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, path), newOfferData);
        onShowStatus('success', 'Tawaran Berjaya Dicipta!', 'Tawaran baru anda kini aktif dalam direktori REFERRA.', 2500);
      }

      setTitle('');
      setDescription('');
      setProductUrl('');
      setProductImageUrl('');
      setContactInstructions('');
      setOwnerWhatsapp('');
      setOwnerEmail('');
      setCommissionAmount(10);
      setCategory('Servis');
      setActiveSection('offers');
    } catch (error: any) {
      handleFirestoreError(error, editingOfferId ? OperationType.UPDATE : OperationType.CREATE, path);
      const errMsg = editingOfferId ? 'Ralat ketika mengemas kini tawaran.' : 'Ralat ketika menyimpan tawaran baru.';
      setErrorMsg(errMsg);
      onShowStatus('error', 'Gagal Menyimpan Tawaran', errMsg + ' ' + (error.message || 'Sila cuba lagi.'));
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleToggleOfferStatus = async (offer: Offer) => {
    const path = `offers/${offer.id}`;
    const newStatus = offer.status === 'aktif' ? 'tamat' : 'aktif';
    try {
      await updateDoc(doc(db, 'offers', offer.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (confirm('Adakah anda pasti mahu memadam tawaran komisen ini? Ejen tidak lagi dapat melihatnya.')) {
      const path = `offers/${offerId}`;
      try {
        await deleteDoc(doc(db, 'offers', offerId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Filters search
  const filteredOffers = offers.filter(o => 
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeOffersCount = offers.filter(o => o.status === 'aktif').length;
  const expiredOffersCount = offers.filter(o => o.status === 'tamat').length;
  
  // Calculate completion percentage for donut chart
  const activePercentage = offers.length > 0 ? Math.round((activeOffersCount / offers.length) * 100) : 0;

  return (
    <div className="min-h-screen w-full max-w-full overflow-hidden bg-slate-50 flex" id="komisenhub-owner-dashboard-root">
      
      {/* 1. LEFT SIDEBAR (Desktop: visible, Mobile: slide-over) */}
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
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200/60 shrink-0 uppercase">
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
                  onClick={() => { setActiveSection('offers'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeSection === 'offers'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center space-x-3">
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>Tawaran Komisen Saya</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeSection === 'offers' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {offers.length}
                  </span>
                </button>

                <button
                  onClick={() => { handleOpenCreateModal(); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeSection === 'create_offer'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Cipta Tawaran Baru</span>
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
                  <span>Bantuan & FAQ</span>
                </button>

                {onToggleRole && (
                  <button
                    onClick={onToggleRole}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-all"
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Tukar ke Mod Ejen</span>
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
        <div className="mt-8 bg-gradient-to-tr from-blue-900 to-slate-800 rounded-2xl p-4 text-white relative overflow-hidden shadow-md">
          <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-blue-500 rounded-full opacity-20"></div>
          <span className="text-[8px] uppercase tracking-wider bg-blue-500 text-white font-bold px-2 py-0.5 rounded-full inline-block">Pro Tips</span>
          <h4 className="text-xs font-bold mt-2 text-white">Promosikan Lebih Laju!</h4>
          <p className="text-[10px] text-slate-300 mt-1 leading-normal">
            Sediakan swipes pemasaran (FB Ads, Tiktok) untuk memudahkan ejen meniru kempen jualan anda.
          </p>
          <button 
            onClick={() => setActiveSection('help')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg mt-3 transition-colors text-center"
          >
            Lihat Panduan
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
        
        {/* TOP BAR / HEADER (Dashboard header) */}
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
                placeholder="Cari kerja atau tawaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400 bg-white border border-slate-200 px-1 py-0.5 rounded font-mono">
                ⌘ F
              </span>
            </div>
          </div>

          {/* Right section - actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Active role indicator and switcher */}
            <div className="flex items-center space-x-2">
              <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider hidden sm:inline-flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                Panel Pemilik
              </span>
              {onToggleRole && (
                <button 
                  onClick={onToggleRole}
                  className="bg-slate-50 border border-slate-200 hover:border-blue-300 text-slate-700 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all hidden sm:block"
                >
                  Tukar Mod Ejen
                </button>
              )}
            </div>

            {/* Simulated Notification bell */}
            <button className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-lg relative" title="Pemberitahuan">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>

            {/* Profile Detail Mini widget */}
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-blue-200">
                {userProfile.displayName?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{userProfile.displayName}</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{userProfile.role === UserRole.OWNER ? 'Business Owner' : 'Affiliate Ejen'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENTS */}
        <main className="flex-grow p-4 sm:p-8">

          {/* =========================================
              VIEW: CREATE/EDIT OFFER FORM (INLINE)
              ========================================= */}
          {activeSection === 'create_offer' && (
            <div className="space-y-6 max-w-2xl bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingOfferId ? 'Edit Maklumat Tawaran Komisen' : 'Senaraikan Tawaran Komisen Baru'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">Sediakan butiran produk dan jumlah komisen untuk menarik ejen rujukan.</p>
              </div>

              <form onSubmit={async (e) => {
                await handleCreateOffer(e);
              }} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center border border-red-100 gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tajuk Tawaran *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ebook Rahsia Hartanah KL atau Komisen Jualan Perfume Wangi"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Penjelasan Produk &amp; Tawaran *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Huraikan kelebihan produk anda, sasaran pasaran, dan apa-apa maklumat tambahan yang membantu ejen memahami kualiti tawaran anda."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
                  />
                </div>

                {/* Category, Comm, Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Kategori *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Amaun Komisen *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Jenis Komisen *
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setCommissionType(CommissionType.PERCENTAGE)}
                        className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                          commissionType === CommissionType.PERCENTAGE
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Peratus (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommissionType(CommissionType.FIXED)}
                        className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                          commissionType === CommissionType.FIXED
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Tetap (RM)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product URL */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Pautan Laman Jualan / Info Produk *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://perniagaananda.com/produk-utama"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Gambar Produk */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gambar Produk (Upload fail atau masukkan pautan gambar)
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Drag and drop Area */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all relative ${
                        dragActive 
                          ? 'border-blue-500 bg-blue-50/50' 
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="product-image-upload-inline" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageFile(e.target.files[0]);
                          }
                        }}
                      />
                      
                      {productImageUrl && productImageUrl.startsWith('data:image/') ? (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden group">
                          <img src={productImageUrl} alt="Pratonton" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setProductImageUrl('')}
                            className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold"
                          >
                            Padam Gambar
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="product-image-upload-inline" className="cursor-pointer flex flex-col items-center justify-center py-2 w-full h-24">
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-[10px] font-semibold text-slate-600">Pilih atau heret fail ke sini</span>
                          <span className="text-[8px] text-slate-400 mt-0.5">Maks 500KB</span>
                        </label>
                      )}
                    </div>

                    {/* Manual URL Input */}
                    <div className="flex flex-col justify-between space-y-2">
                      <input
                        type="url"
                        placeholder="Atau letakkan URL imej terus..."
                        value={productImageUrl && !productImageUrl.startsWith('data:image/') ? productImageUrl : ''}
                        onChange={(e) => setProductImageUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      />
                      {productImageUrl && !productImageUrl.startsWith('data:image/') && (
                        <div className="border border-slate-200 rounded-lg overflow-hidden h-12 bg-slate-50 flex items-center justify-center relative">
                          <img src={productImageUrl} alt="Pratonton URL" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                          <button type="button" onClick={() => setProductImageUrl('')} className="absolute right-1 top-1 bg-slate-900 text-white rounded-full p-0.5 text-[8px]">X</button>
                        </div>
                      )}
                      <p className="text-[9px] text-slate-400 leading-tight">Menyediakan imej produk meningkatkan pendedahan listing jualan anda.</p>
                    </div>
                  </div>
                </div>

                {/* Hubungi Pemilik (WhatsApp & Email) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      No. WhatsApp untuk Dihubungi *
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 60123456789"
                        value={ownerWhatsapp}
                        onChange={(e) => setOwnerWhatsapp(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Emel untuk Dihubungi *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="Contoh: pemilik@perniagaan.com"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Instructions */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Arahan Cara Ejen Menghubungi Anda (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Sila WhatsApp saya berserta butiran ringkas portfolio pemasaran media sosial anda..."
                    value={contactInstructions}
                    onChange={(e) => setContactInstructions(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveSection('offers')}
                    className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOffer}
                    className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {submittingOffer ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {editingOfferId ? 'Simpan Edit' : 'Papar Tawaran'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}


          {/* =========================================
              VIEW 2: OFFERS LISTING VIEW (ALL RE-STYLED)
              ========================================= */}
          {activeSection === 'offers' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Senarai Tawaran Komisen Anda</h2>
                  <p className="text-xs text-slate-500 mt-1">Cipta, edit dan kawal status tawaran pemasaran anda secara langsung.</p>
                </div>
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Cipta Tawaran Baharu
                </button>
              </div>

              {/* SEARCH & FILTERS BAR */}
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari tajuk atau kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
                <div className="text-xs font-bold text-slate-500 shrink-0">
                  Jumlah Tawaran: <span className="text-blue-600">{filteredOffers.length}</span>
                </div>
              </div>

              {/* MAIN OFFERS GRID LIST */}
              {loadingOffers ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-xs">Memuatkan senarai tawaran...</p>
                </div>
              ) : filteredOffers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Tiada Tawaran Dijumpai</h4>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto mb-5">
                    Anda tidak menyenaraikan sebarang tawaran lagi atau tiada tawaran bertepatan dengan kata kunci carian anda.
                  </p>
                  <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Bina Tawaran Pertama
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOffers.map((offer) => (
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
                            <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-md backdrop-blur-xs ${
                              offer.status === 'aktif' 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-red-500 text-white'
                            }`}>
                              {offer.status === 'aktif' ? 'Aktif' : 'Tamat'}
                            </span>
                          </div>

                          <div className="p-5">
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <span className="bg-blue-50 border border-blue-100/50 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                {offer.category}
                              </span>
                            </div>

                            <h4 className="text-sm font-extrabold text-slate-900 mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">{offer.title}</h4>
                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">{offer.description}</p>
                            
                            {/* Summary Rate info */}
                            <div className="space-y-2 bg-slate-50 p-3 rounded-xl mb-4 text-xs border border-slate-100">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-semibold text-[10px]">KADAR KOMISEN</span>
                                <span className="font-black text-blue-600 text-sm">
                                  {offer.commissionType === CommissionType.PERCENTAGE ? `${offer.commissionAmount}%` : `RM ${offer.commissionAmount.toFixed(2)}`}
                                </span>
                              </div>
                              {offer.contactInstructions && (
                                <div className="pt-1 border-t border-slate-200/40">
                                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Arahan Hubungi</span>
                                  <p className="text-slate-600 leading-normal text-[11px] line-clamp-1">{offer.contactInstructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card actions */}
                        <div className="px-5 pb-5 space-y-3">
                          <div className="pt-3 border-t border-slate-100 space-y-3">
                            <a
                              href={offer.productUrl}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all gap-1"
                            >
                              Buka Info Laman Jualan
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditModal(offer)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors border border-blue-100 flex items-center justify-center gap-1 flex-1"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold">Edit</span>
                              </button>
                              <button
                                onClick={() => handleToggleOfferStatus(offer)}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                                  offer.status === 'aktif'
                                    ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {offer.status === 'aktif' ? 'Tamatkan' : 'Aktifkan'}
                              </button>
                              <button
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-slate-200"
                                title="Padam"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}





          {/* =========================================
              VIEW 5: HELP & FAQ
              ========================================= */}
          {activeSection === 'help' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Pusat Bantuan & Panduan REFERRA</h2>
                <p className="text-xs text-slate-500 mt-1">Sokongan maklumat untuk melancarkan urusan perkongsian komisen perniagaan.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="font-bold text-slate-800 text-sm">Bagaimanakah penjejakan (tracking) dilakukan?</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    REFERRA ialah direktori tertutup bertulis sahaja. Kami tiada pautan tracking, tiada pengiraan klik automatik mahupun sistem integrasi pixel. Semuanya berlaku di luar platform. Anda dan ejen bersetuju menggunakan mekanisme manual (contohnya kod promo unik, borang google, borang pengesahan WhatsApp, atau pautan affiliate e-dagang sedia ada anda).
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="font-bold text-slate-800 text-sm">Bagaimana cara membayar komisen kepada ejen?</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Pembayaran komisen diuruskan sepenuhnya oleh anda sendiri di luar sistem ini. Anda boleh menetapkan jadual pembayaran (contoh: mingguan, setiap hari ke-15 bulan berikutnya, atau serta-merta) mengikut kesepakatan bersama ejen melalui WhatsApp atau Telegram.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="font-bold text-slate-800 text-sm">Apakah format gambar produk yang disokong?</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Anda boleh memuat naik gambar berformat PNG, JPG, JPEG, atau WEBP dengan saiz maksima 500KB. Untuk mengelakkan had penyimpanan, sila gunakan imej bersaiz kecil atau masukkan pautan URL gambar terus ke borang.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* =========================================
          CREATE/EDIT OFFER FORM MODAL (FULLY RE-STYLED)
          ========================================= */}
      {false && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900">
                {editingOfferId ? 'Edit Maklumat Tawaran Komisen' : 'Senaraikan Tawaran Komisen Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center border border-red-100 gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tajuk Tawaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ebook Rahsia Hartanah KL atau Komisen Jualan Perfume Wangi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Penjelasan Produk &amp; Tawaran *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Huraikan kelebihan produk anda, sasaran pasaran, dan apa-apa maklumat tambahan yang membantu ejen memahami kualiti tawaran anda."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
                />
              </div>

              {/* Category, Comm, Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Kategori *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Amaun Komisen *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Jenis Komisen *
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCommissionType(CommissionType.PERCENTAGE)}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                        commissionType === CommissionType.PERCENTAGE
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Peratus (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommissionType(CommissionType.FIXED)}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                        commissionType === CommissionType.FIXED
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Tetap (RM)
                    </button>
                  </div>
                </div>
              </div>

              {/* Product URL */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Pautan Laman Jualan / Info Produk *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://perniagaananda.com/produk-utama"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Gambar Produk */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Gambar Produk (Upload fail atau masukkan pautan gambar)
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Drag and drop Area */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all relative ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50/50' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="product-image-upload-bento" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    
                    {productImageUrl && productImageUrl.startsWith('data:image/') ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden group">
                        <img src={productImageUrl} alt="Pratonton" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProductImageUrl('')}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold"
                        >
                          Padam Gambar
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="product-image-upload-bento" className="cursor-pointer flex flex-col items-center justify-center py-2 w-full h-24">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[10px] font-semibold text-slate-600">Pilih atau heret fail ke sini</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">Maks 500KB</span>
                      </label>
                    )}
                  </div>

                  {/* Manual URL Input */}
                  <div className="flex flex-col justify-between space-y-2">
                    <input
                      type="url"
                      placeholder="Atau letakkan URL imej terus..."
                      value={productImageUrl && !productImageUrl.startsWith('data:image/') ? productImageUrl : ''}
                      onChange={(e) => setProductImageUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                    {productImageUrl && !productImageUrl.startsWith('data:image/') && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden h-12 bg-slate-50 flex items-center justify-center relative">
                        <img src={productImageUrl} alt="Pratonton URL" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        <button type="button" onClick={() => setProductImageUrl('')} className="absolute right-1 top-1 bg-slate-900 text-white rounded-full p-0.5 text-[8px]">X</button>
                      </div>
                    )}
                    <p className="text-[9px] text-slate-400 leading-tight">Menyediakan imej produk meningkatkan pendedahan listing jualan anda.</p>
                  </div>
                </div>
              </div>

              {/* Contact Instructions */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Arahan Cara Ejen Menghubungi Anda (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Sila WhatsApp saya berserta butiran ringkas portfolio pemasaran media sosial anda untuk memulakan kerjasama."
                  value={contactInstructions}
                  onChange={(e) => setContactInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingOffer ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      {editingOfferId ? 'Simpan Edit' : 'Papar Tawaran'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
