/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Briefcase, DollarSign, CheckCircle, 
  Trash2, AlertCircle, FileText, Info, Loader2, Send, 
  ExternalLink, Smartphone, MessageCircle, Mail, Upload, Image as ImageIcon,
  Pencil, Users
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, addDoc, updateDoc, doc, 
  onSnapshot, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { UserProfile, Offer, CommissionType } from '../types';

interface DashboardOwnerProps {
  userProfile: UserProfile;
  onToggleRole?: () => void;
}

export const DashboardOwner: React.FC<DashboardOwnerProps> = ({ userProfile, onToggleRole }) => {
  // State management
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  
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
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);

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
    setErrorMsg('');
    setIsModalOpen(true);
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
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleImageFile = (file: File) => {
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Sila pilih fail gambar sahaja (PNG, JPG, JPEG, WEBP).');
      return;
    }

    // Limit base64 image size to avoid exceeding firestore doc limit (keep it <= 500kb)
    if (file.size > 500000) {
      alert('Sila pilih gambar bersaiz kecil (kurang daripada 500KB) untuk prestasi terbaik.');
      return;
    }

    // Read file and set as base64
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

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Categories
  const categories = ['Fizikal', 'Digital', 'Servis', 'Makanan', 'Hartanah', 'Pendidikan', 'Kesihatan &amp; Kecantikan', 'Kewangan'];

  // 1. Fetch Owner's own Offers
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

  // Handle create/edit offer
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !productUrl || commissionAmount <= 0) {
      setErrorMsg('Sila isi semua ruangan bertanda * dengan lengkap.');
      return;
    }

    setSubmittingOffer(true);
    setErrorMsg('');

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
          updatedAt: serverTimestamp(),
        });
        setEditingOfferId(null);
      } else {
        const newOfferData = {
          ownerId: userProfile.uid,
          ownerName: userProfile.displayName,
          ownerEmail: userProfile.email,
          ownerWhatsapp: userProfile.whatsapp || '',
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
      }

      // Reset form & close modal
      setTitle('');
      setDescription('');
      setProductUrl('');
      setProductImageUrl('');
      setContactInstructions('');
      setCommissionAmount(10);
      setCategory('Servis');
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingOfferId ? OperationType.UPDATE : OperationType.CREATE, path);
      setErrorMsg(editingOfferId ? 'Ralat ketika mengemas kini tawaran.' : 'Ralat ketika menyimpan tawaran baru.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Handle Toggle Offer Status (aktif/tamat)
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

  // Handle Delete Offer
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

  // Filters search
  const filteredOffers = offers.filter(o => 
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeOffersCount = offers.filter(o => o.status === 'aktif').length;
  const expiredOffersCount = offers.filter(o => o.status === 'tamat').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="dashboard-owner-root">
      
      {/* Welcome banner */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs uppercase font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            PANEL PEMILIK PERNIAGAAN
          </span>
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 tracking-tight mt-2">
            Selamat Datang, {userProfile.displayName}!
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Uruskan senarai tawaran komisen bertulis anda. Ejen affiliate akan melihat tawaran ini dan menghubungi anda secara terus di luar sistem.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all duration-200 shrink-0"
          id="btn-create-offer-trigger"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Tawaran Baru
        </button>
      </div>

      {/* Switch Mode Invitation */}
      {onToggleRole && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Mahu Mendaftar / Masuk Sebagai Ejen Affiliate?</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Anda juga boleh meneroka pelbagai tawaran komisen yang disenaraikan oleh perniagaan lain dan bekerjasama sebagai ejen jualan!
              </p>
            </div>
          </div>
          <button
            onClick={onToggleRole}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
          >
            Tukar / Daftar Sebagai Ejen &rarr;
          </button>
        </div>
      )}

      {/* Info Warning */}
      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-700 text-xs flex items-start gap-3 mb-10">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
        <div className="leading-relaxed">
          <strong>Perhatian:</strong> KomisenHub ialah direktori maklumat sahaja. Anda tidak perlu menyepadukan API/Pixel, menjana pautan rujukan automatik atau membuat pembayaran di sini. Semua kerjasama, penjejakan jualan, dan pembayaran komisen dilakukan secara terus antara anda dan ejen di luar platform ini.
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Jumlah Tawaran Saya</span>
            <span className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 mt-1 block">
              {loadingOffers ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : offers.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Tawaran Aktif</span>
            <span className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 mt-1 block">
              {loadingOffers ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : activeOffersCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Tawaran Tamat</span>
            <span className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 mt-1 block">
              {loadingOffers ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : expiredOffersCount}
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
            <Trash2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          Senarai Tawaran Komisen Anda ({filteredOffers.length})
        </h3>
        <div className="relative w-full sm:max-w-md">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tajuk atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* TAWARAN LISTING */}
      {loadingOffers ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500">Memuatkan senarai tawaran...</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 mb-2">Tiada Tawaran Dijumpai</h4>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Anda belum menyenaraikan sebarang tawaran lagi, atau carian anda tiada padanan. Senaraikan tawaran pertama anda untuk menarik ejen pemasaran.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Senaraikan Tawaran Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-blue-50/40 border border-blue-100 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between">
              <div>
                {/* Product Image or Placeholder */}
                <div className="w-full h-40 bg-slate-50 border border-slate-200/60 rounded-xl mb-4 overflow-hidden flex items-center justify-center relative">
                  {offer.productImageUrl ? (
                    <img 
                      src={offer.productImageUrl} 
                      alt={offer.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 gap-1 p-4 text-center">
                      <ImageIcon className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">KomisenHub</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start gap-4 mb-4">
                  <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wide">
                    {offer.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    offer.status === 'aktif' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {offer.status === 'aktif' ? 'Aktif' : 'Tamat'}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-900 mb-2">{offer.title}</h4>
                <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">{offer.description}</p>
                
                {/* Details list */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl mb-4 text-xs">
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Kadar Komisen</span>
                    <span className="font-bold text-blue-600 text-sm">
                      {offer.commissionType === CommissionType.PERCENTAGE 
                        ? `${offer.commissionAmount}%` 
                        : `RM ${offer.commissionAmount.toFixed(2)}`
                      }
                    </span>
                  </div>

                  {offer.contactInstructions && (
                    <div className="pt-1">
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px] mb-1">Arahan Hubungi</span>
                      <p className="text-slate-700 leading-normal bg-white p-2 rounded-lg border border-slate-200/40">{offer.contactInstructions}</p>
                    </div>
                  )}

                  {/* Show contact details attached */}
                  <div className="pt-2 border-t border-slate-200/40">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px] mb-1">Hubungan Terus Anda</span>
                    <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                      {userProfile.whatsapp && (
                        <div className="flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" /> {userProfile.whatsapp}
                        </div>
                      )}
                      {userProfile.telegram && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-slate-400" /> {userProfile.telegram}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {userProfile.email}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <a
                  href={offer.productUrl}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-lg transition-all mb-4 gap-1.5"
                >
                  Buka Laman Jualan
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditModal(offer)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 flex items-center justify-center gap-1.5"
                    title="Edit Semula Listing"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="text-xs font-bold">Edit</span>
                  </button>
                  <button
                    onClick={() => handleToggleOfferStatus(offer)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      offer.status === 'aktif'
                        ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {offer.status === 'aktif' ? 'Tamatkan' : 'Aktifkan Semula'}
                  </button>
                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                    title="Padam Tawaran"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-sans font-bold text-slate-900">
                {editingOfferId ? 'Edit Tawaran Komisen Anda' : 'Senaraikan Tawaran Komisen Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors font-bold text-sm"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center border border-red-100 gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tajuk Tawaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ebook Rahsia Hartanah KL atau Komisen Jualan Perfume Wangi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Penjelasan Produk & Tawaran *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Huraikan kelebihan produk anda, sasaran pasaran, dan apa-apa maklumat tambahan yang membantu ejen memahami kualiti tawaran anda."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Category, Comm, Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Amaun Komisen *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jenis Komisen *
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCommissionType(CommissionType.PERCENTAGE)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        commissionType === CommissionType.PERCENTAGE
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Peratus (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommissionType(CommissionType.FIXED)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        commissionType === CommissionType.FIXED
                          ? 'bg-white text-blue-600 shadow-sm'
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pautan Laman Jualan / Info Produk *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://perniagaananda.com/produk-utama"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Gambar Produk */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gambar Produk (Sila Muat Naik fail atau Masukkan URL gambar)
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Drag and drop Area */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all relative ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50/50' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="product-image-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    
                    {productImageUrl && productImageUrl.startsWith('data:image/') ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden group">
                        <img 
                          src={productImageUrl} 
                          alt="Pratonton gambar produk" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setProductImageUrl('')}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
                        >
                          Padam Gambar
                        </button>
                      </div>
                    ) : (
                      <label 
                        htmlFor="product-image-upload" 
                        className="cursor-pointer flex flex-col items-center justify-center py-4 w-full h-32"
                      >
                        <Upload className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5]" />
                        <span className="text-xs font-semibold text-slate-600">
                          Klik untuk pilih atau heret gambar ke sini
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          PNG, JPG, JPEG, WEBP (Maks 500KB)
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Manual URL Input or Preview of direct URL */}
                  <div className="flex flex-col justify-between space-y-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-slate-500 mb-1">
                        Atau masukkan URL gambar produk:
                      </span>
                      <input
                        type="url"
                        placeholder="https://contoh.com/gambar-produk.jpg"
                        value={productImageUrl && !productImageUrl.startsWith('data:image/') ? productImageUrl : ''}
                        onChange={(e) => setProductImageUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    {/* Real-time preview of non-base64 URL */}
                    {productImageUrl && !productImageUrl.startsWith('data:image/') && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden h-20 bg-slate-50 flex items-center justify-center relative">
                        <img 
                          src={productImageUrl} 
                          alt="Pratonton URL" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If load fails, hide image preview cleanly
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setProductImageUrl('')}
                          className="absolute right-1 top-1 bg-slate-950/70 text-white rounded-full p-1 text-[10px] hover:bg-slate-900"
                        >
                          Padam
                        </button>
                      </div>
                    )}
                    
                    <div className="text-[10px] text-slate-500 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Tip:</strong> Menambah gambar produk membantu menarik minat ejen affiliate sehingga 3 kali ganda lebih tinggi untuk mempromosikan produk anda.
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Arahan Cara Ejen Menghubungi Anda (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Sila WhatsApp saya berserta butiran ringkas portfolio pemasaran media sosial anda untuk memulakan kerjasama."
                  value={contactInstructions}
                  onChange={(e) => setContactInstructions(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 text-sm font-semibold text-slate-500 hover:text-slate-800 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="flex-1 py-3 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingOffer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {editingOfferId ? 'Simpan Perubahan' : 'Paparkan Tawaran'}
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
