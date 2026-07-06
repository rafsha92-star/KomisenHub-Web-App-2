/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, Briefcase, ExternalLink, Heart, Info, 
  Loader2, Mail, Smartphone, MessageCircle, XCircle, ChevronDown, ChevronUp, Image as ImageIcon
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, query, where, addDoc, deleteDoc, doc, 
  getDocs, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { UserProfile, Offer, CommissionType } from '../types';

interface DashboardAffiliateProps {
  userProfile: UserProfile;
  onToggleRole?: () => void;
}

export const DashboardAffiliate: React.FC<DashboardAffiliateProps> = ({ userProfile, onToggleRole }) => {
  // Database states
  const [offers, setOffers] = useState<Offer[]>([]);
  const [favoriteOfferIds, setFavoriteOfferIds] = useState<string[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Active view states
  const [activeTab, setActiveTab] = useState<'marketplace' | 'kegemaran'>('marketplace');

  // Interactive filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Contact Modal state
  const [contactingOffer, setContactingOffer] = useState<Offer | null>(null);

  // Categories
  const categories = ['Semua', 'Fizikal', 'Digital', 'Servis', 'Makanan', 'Hartanah', 'Pendidikan', 'Kesihatan &amp; Kecantikan', 'Kewangan'];

  // 1. Fetch all active offers from the entire platform
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

  // 2. Fetch favorite list
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

  // Filter offers based on search and category
  const filteredOffers = offers.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || o.category === categoryFilter;
    
    if (activeTab === 'kegemaran') {
      const isFavorite = favoriteOfferIds.includes(o.id);
      return matchesSearch && matchesCategory && isFavorite;
    }
    return matchesSearch && matchesCategory;
  });

  // Prefilled WhatsApp link
  const getWhatsAppLink = (offer: Offer) => {
    const cleanNum = (offer.ownerWhatsapp || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Halo ${offer.ownerName}, saya melihat tawaran komisen anda di KomisenHub ("${offer.title}") dan berminat untuk bekerjasama. Boleh kita bincangkan lebih lanjut?`);
    return `https://wa.me/${cleanNum}?text=${text}`;
  };

  // Prefilled Telegram link
  const getTelegramLink = (offer: Offer) => {
    const cleanHandle = (offer.ownerTelegram || '').replace('@', '');
    return `https://t.me/${cleanHandle}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="dashboard-affiliate-root">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
        <span className="text-xs uppercase font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          PANEL EJEN KOMISEN / AFFILIATE
        </span>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 tracking-tight mt-2">
          Selamat Datang, {userProfile.displayName}!
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Terokai direktori tawaran komisen, simpan tawaran kegemaran anda, dan hubungi pemilik perniagaan secara terus di luar platform untuk mula bekerjasama.
        </p>
      </div>

      {/* Switch Mode Invitation */}
      {onToggleRole && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 mt-0.5">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Mahu Mendaftar / Masuk Sebagai Pemilik Perniagaan?</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Anda juga boleh mendaftar perniagaan anda dan mula mempamerkan produk anda untuk menarik ejen-ejen pemasaran bekerjasama!
              </p>
            </div>
          </div>
          <button
            onClick={onToggleRole}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
          >
            Tukar / Daftar Sebagai Pemilik &rarr;
          </button>
        </div>
      )}

      {/* Info warning */}
      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-700 text-xs flex items-start gap-3 mb-10">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
        <div className="leading-relaxed">
          <strong>Bagaimana ia berfungsi:</strong> KomisenHub menghubungkan anda dengan pemilik perniagaan secara terus. Kami tidak memantau atau mengesan klik, pautan, rujukan atau menguruskan pembayaran. Anda akan bersetuju, berkomunikasi dan menerima bayaran secara manual langsung daripada pemilik perniagaan luar daripada sistem ini.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`pb-4 px-6 font-semibold text-sm transition-all relative ${
            activeTab === 'marketplace'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-marketplace"
        >
          Semua Tawaran Aktif
          <span className="ml-2 bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">
            {offers.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('kegemaran')}
          className={`pb-4 px-6 font-semibold text-sm transition-all relative ${
            activeTab === 'kegemaran'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-favorites"
        >
          Senarai Kegemaran Saya
          <span className="ml-2 bg-rose-50 text-rose-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {favoriteOfferIds.length}
          </span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="relative w-full md:max-w-md">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari produk atau kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Offers listings list */}
      {loadingOffers ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Memuatkan senarai tawaran...</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 mb-2">Tiada Tawaran</h4>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {activeTab === 'kegemaran' 
              ? 'Anda belum menandakan mana-mana tawaran komisen sebagai kegemaran anda lagi.' 
              : 'Tiada tawaran komisen aktif di bawah kategori atau carian ini buat masa sekarang.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => {
            const isFavorite = favoriteOfferIds.includes(offer.id);
            return (
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

                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wide">
                      {offer.category}
                    </span>
                    <button
                      onClick={() => handleToggleFavorite(offer.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isFavorite 
                          ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' 
                          : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={isFavorite ? "Keluarkan dari Kegemaran" : "Simpan ke Kegemaran"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{offer.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-4 line-clamp-3 whitespace-pre-line">{offer.description}</p>

                  {/* Commission info box */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2 border border-slate-100 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                      <span className="text-slate-500 font-medium">Tawaran Komisen</span>
                      <span className="text-base font-extrabold text-blue-600">
                        {offer.commissionType === CommissionType.PERCENTAGE
                          ? `${offer.commissionAmount}% Jualan`
                          : `RM ${offer.commissionAmount.toFixed(2)}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>Pemilik Perniagaan:</span>
                      <span className="font-semibold text-slate-800">{offer.ownerName}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href={offer.productUrl}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-lg transition-all gap-1.5"
                  >
                    Buka Laman Jualan Produk
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setContactingOffer(offer)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Hubungi Pemilik Perniagaan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTACT BUSINESS OWNER MODAL */}
      {contactingOffer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-sans font-bold text-slate-900">
                Hubungi Pemilik Perniagaan
              </h3>
              <button
                onClick={() => setContactingOffer(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Tawaran Komisen</span>
                <h4 className="text-lg font-bold text-slate-900 mt-1">{contactingOffer.title}</h4>
                <p className="text-xs text-slate-500 mt-1">Disediakan oleh {contactingOffer.ownerName}</p>
              </div>

              {/* Arahan Hubungi */}
              {contactingOffer.contactInstructions && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs">
                  <span className="font-bold text-amber-800 block uppercase tracking-wider text-[9px] mb-1">Arahan Cara Menghubungi:</span>
                  <p className="text-amber-900 leading-normal whitespace-pre-line">{contactingOffer.contactInstructions}</p>
                </div>
              )}

              {/* Contact Actions Grid */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Klik Saluran Hubungan Terus:</span>
                
                {/* WhatsApp */}
                {contactingOffer.ownerWhatsapp ? (
                  <a
                    href={getWhatsAppLink(contactingOffer)}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-100 transition-all font-semibold text-sm"
                  >
                    <span className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                      Hubungi via WhatsApp
                    </span>
                    <span className="text-xs text-emerald-600 bg-white/60 px-2 py-0.5 rounded font-mono font-medium">
                      {contactingOffer.ownerWhatsapp}
                    </span>
                  </a>
                ) : (
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 text-xs flex items-center gap-3">
                    <Smartphone className="w-5 h-5" />
                    Nombor WhatsApp tidak disediakan
                  </div>
                )}

                {/* Telegram */}
                {contactingOffer.ownerTelegram ? (
                  <a
                    href={getTelegramLink(contactingOffer)}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex items-center justify-between p-4 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-2xl border border-sky-100 transition-all font-semibold text-sm"
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-sky-600" />
                      Hubungi via Telegram
                    </span>
                    <span className="text-xs text-sky-600 bg-white/60 px-2 py-0.5 rounded font-mono font-medium">
                      {contactingOffer.ownerTelegram}
                    </span>
                  </a>
                ) : (
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 text-xs flex items-center gap-3">
                    <MessageCircle className="w-5 h-5" />
                    Username Telegram tidak disediakan
                  </div>
                )}

                {/* Email */}
                {contactingOffer.ownerEmail ? (
                  <a
                    href={`mailto:${contactingOffer.ownerEmail}?subject=Kerjasama KomisenHub: ${encodeURIComponent(contactingOffer.title)}`}
                    className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-2xl border border-blue-100 transition-all font-semibold text-sm"
                  >
                    <span className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      Hubungi via E-mel
                    </span>
                    <span className="text-xs text-blue-600 bg-white/60 px-2 py-0.5 rounded font-mono font-medium">
                      {contactingOffer.ownerEmail}
                    </span>
                  </a>
                ) : null}
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <button
                  onClick={() => setContactingOffer(null)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-colors"
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
