/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole, Offer } from '../types';
import { 
  Users, Briefcase, Trash2, Shield, Search, ArrowLeft, 
  Loader2, Mail, Smartphone, ExternalLink, Calendar,
  TrendingUp, CheckCircle, AlertCircle, FileText, Edit, Plus, ShieldAlert
} from 'lucide-react';

interface DashboardAdminProps {
  onExit: () => void;
  adminEmail: string;
}

interface AdminRecord {
  email: string;
  addedBy?: string;
  createdAt?: Date;
}

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({ onExit, adminEmail }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'offers' | 'admins'>('users');
  
  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [offerSearch, setOfferSearch] = useState('');
  const [offerStatusFilter, setOfferStatusFilter] = useState<string>('all');

  // Admin Management form states
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // User Edit states
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.AFFILIATE);
  const [savingUser, setSavingUser] = useState(false);

  // Load database data
  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    
    if (!auth.currentUser) {
      setErrorMsg('Sila log masuk ke dalam akaun anda terlebih dahulu sebelum mengakses Panel Pentadbir.');
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      const loadedUsers: UserProfile[] = [];
      usersSnap.forEach((doc) => {
        const data = doc.data();
        loadedUsers.push({
          uid: doc.id,
          displayName: data.displayName || 'Tiada Nama',
          email: data.email || '',
          role: data.role as UserRole,
          whatsapp: data.whatsapp || '',
          telegram: data.telegram || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      setUsers(loadedUsers);

      // 2. Fetch Offers
      const offersSnap = await getDocs(query(collection(db, 'offers'), orderBy('createdAt', 'desc')));
      const loadedOffers: Offer[] = [];
      offersSnap.forEach((doc) => {
        const data = doc.data();
        loadedOffers.push({
          id: doc.id,
          ownerId: data.ownerId || '',
          ownerName: data.ownerName || '',
          ownerEmail: data.ownerEmail || '',
          ownerWhatsapp: data.ownerWhatsapp || '',
          ownerTelegram: data.ownerTelegram || '',
          title: data.title || '',
          description: data.description || '',
          commissionAmount: Number(data.commissionAmount) || 0,
          commissionType: data.commissionType || 'percentage',
          productUrl: data.productUrl || '',
          category: data.category || '',
          status: data.status || 'aktif',
          productImageUrl: data.productImageUrl || '',
          contactInstructions: data.contactInstructions || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      setOffers(loadedOffers);

      // 3. Fetch Admins
      try {
        const adminsSnap = await getDocs(collection(db, 'admins'));
        const loadedAdmins: AdminRecord[] = [];
        adminsSnap.forEach((doc) => {
          const data = doc.data();
          loadedAdmins.push({
            email: doc.id,
            addedBy: data.addedBy || 'Sistem',
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
        setAdmins(loadedAdmins);
      } catch (err) {
        console.warn('Could not load admins collection (might not exist yet):', err);
        setAdmins([]);
      }

    } catch (error: any) {
      console.error('Error loading admin data:', error);
      setErrorMsg('Gagal memuatkan data dari pangkalan data. Pastikan anda mempunyai akses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Admin addition
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    
    const emailToCompare = newAdminEmail.trim().toLowerCase();
    if (admins.some(a => a.email === emailToCompare) || emailToCompare === 'rafsha92@gmail.com') {
      setErrorMsg('E-mel ini sudah pun didaftarkan sebagai Pentadbir.');
      return;
    }

    setAddingAdmin(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await setDoc(doc(db, 'admins', emailToCompare), {
        email: emailToCompare,
        addedBy: auth.currentUser?.email || adminEmail,
        createdAt: new Date(),
      });

      setSuccessMsg(`Pentadbir baru dengan e-mel "${emailToCompare}" berjaya ditambah!`);
      setAdmins(prev => [...prev, {
        email: emailToCompare,
        addedBy: auth.currentUser?.email || adminEmail,
        createdAt: new Date(),
      }]);
      setNewAdminEmail('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error adding admin:', err);
      setErrorMsg(`Gagal menambah pentadbir: ${err.message || err}`);
      handleFirestoreError(err, OperationType.WRITE, `admins/${emailToCompare}`);
    } finally {
      setAddingAdmin(false);
    }
  };

  // Admin removal
  const handleRemoveAdmin = async (email: string) => {
    if (email === 'rafsha92@gmail.com') {
      setErrorMsg('Anda tidak boleh memadam pentadbir utama.');
      return;
    }
    
    const confirmDelete = window.confirm(`Adakah anda pasti mahu memadam akses pentadbir bagi "${email}"?`);
    if (!confirmDelete) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await deleteDoc(doc(db, 'admins', email));
      setSuccessMsg(`Akses pentadbir bagi "${email}" telah dibatalkan.`);
      setAdmins(prev => prev.filter(a => a.email !== email));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error removing admin:', err);
      setErrorMsg(`Gagal membatalkan akses pentadbir: ${err.message || err}`);
    }
  };

  // User editing handlers
  const handleStartEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditDisplayName(user.displayName);
    setEditWhatsapp(user.whatsapp || '');
    setEditTelegram(user.telegram || '');
    setEditRole(user.role);
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editDisplayName.trim()) {
      setErrorMsg('Sila masukkan nama penuh.');
      return;
    }

    setSavingUser(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        displayName: editDisplayName.trim(),
        whatsapp: editWhatsapp.trim(),
        telegram: editTelegram.trim(),
        role: editRole,
        updatedAt: new Date(),
      });

      setSuccessMsg(`Profil ahli "${editDisplayName}" berjaya dikemas kini!`);
      
      // Update local state list
      setUsers(prev => prev.map(u => u.uid === editingUser.uid ? {
        ...u,
        displayName: editDisplayName.trim(),
        whatsapp: editWhatsapp.trim(),
        telegram: editTelegram.trim(),
        role: editRole,
        updatedAt: new Date(),
      } : u));

      setEditingUser(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setErrorMsg(`Gagal mengemas kini ahli: ${err.message || err}`);
      handleFirestoreError(err, OperationType.UPDATE, `users/${editingUser.uid}`);
    } finally {
      setSavingUser(false);
    }
  };

  // Handle removing a registered user
  const handleRemoveUser = async (userId: string, userDisplayName: string) => {
    const confirmDelete = window.confirm(`Adakah anda pasti mahu memadam pengguna "${userDisplayName}"? Semua tawaran komisen yang dibuat oleh pengguna ini juga akan dipadamkan.`);
    if (!confirmDelete) return;

    setErrorMsg('');
    setSuccessMsg('');
    try {
      // 1. Delete user document
      await deleteDoc(doc(db, 'users', userId));

      // 2. Find and delete corresponding user's offers
      const userOffers = offers.filter(o => o.ownerId === userId);
      for (const offer of userOffers) {
        await deleteDoc(doc(db, 'offers', offer.id));
      }

      setSuccessMsg(`Pengguna "${userDisplayName}" dan ${userOffers.length} tawaran mereka telah berjaya dipadamkan.`);
      
      // Refresh local state lists
      setUsers(prev => prev.filter(u => u.uid !== userId));
      setOffers(prev => prev.filter(o => o.ownerId !== userId));

      // Clear success alert after 4 seconds
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error: any) {
      console.error('Error removing user:', error);
      setErrorMsg(`Gagal memadam pengguna: ${error.message || error}`);
    }
  };

  // Handle removing an offer
  const handleRemoveOffer = async (offerId: string, offerTitle: string) => {
    const confirmDelete = window.confirm(`Adakah anda pasti mahu memadam tawaran komisen "${offerTitle}"?`);
    if (!confirmDelete) return;

    setErrorMsg('');
    setSuccessMsg('');
    try {
      await deleteDoc(doc(db, 'offers', offerId));
      setSuccessMsg(`Tawaran "${offerTitle}" berjaya dipadamkan.`);
      setOffers(prev => prev.filter(o => o.id !== offerId));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error: any) {
      console.error('Error removing offer:', error);
      setErrorMsg(`Gagal memadam tawaran: ${error.message || error}`);
    }
  };

  // Filter users based on search query and role filter
  const filteredUsers = users.filter(user => {
    const query = userSearch.toLowerCase();
    const matchesSearch = 
      user.displayName.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query) ||
      (user.whatsapp && user.whatsapp.includes(query)) ||
      (user.telegram && user.telegram.toLowerCase().includes(query));
    
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter offers based on search query and status filter
  const filteredOffers = offers.filter(offer => {
    const query = offerSearch.toLowerCase();
    const matchesSearch = 
      offer.title.toLowerCase().includes(query) || 
      offer.description.toLowerCase().includes(query) ||
      offer.ownerName.toLowerCase().includes(query) ||
      offer.category.toLowerCase().includes(query);
    
    const matchesStatus = offerStatusFilter === 'all' || offer.status === offerStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats calculation
  const totalOwners = users.filter(u => u.role === UserRole.OWNER).length;
  const totalAffiliates = users.filter(u => u.role === UserRole.AFFILIATE).length;
  const activeOffersCount = offers.filter(o => o.status === 'aktif').length;

  return (
    <div className="flex-grow bg-slate-900 text-slate-100 min-h-screen font-sans pb-12 flex flex-col overflow-y-auto" id="komisenhub-admin-root">
      {/* Top Banner */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 shadow-md">
              <Shield className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight text-white uppercase">Panel Pentadbir</h1>
                <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Log masuk sebagai: <span className="text-amber-400 font-mono">{adminEmail}</span></p>
            </div>
          </div>
          
          <button
            onClick={onExit}
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all gap-1.5 cursor-pointer w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Aplikasi Utama
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-grow w-full space-y-6">
        
        {/* Success / Error Messages */}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dashboard Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1 */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Jumlah Ahli</p>
              <h3 className="text-2xl font-black text-white">{users.length}</h3>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pemilik Bisnes</p>
              <h3 className="text-2xl font-black text-white">{totalOwners}</h3>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ejen Affiliate</p>
              <h3 className="text-2xl font-black text-white">{totalAffiliates}</h3>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tawaran Aktif</p>
              <h3 className="text-2xl font-black text-white">{activeOffersCount} / {offers.length}</h3>
            </div>
          </div>
        </div>

        {/* Tabs Selection */}
        <div className="flex overflow-x-auto border-b border-slate-800 scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Pengurusan Ahli ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'offers'
                ? 'border-amber-500 text-amber-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Pengurusan Tawaran ({offers.length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'admins'
                ? 'border-amber-500 text-amber-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Pengurusan Pentadbir ({admins.length + 1})
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-sm text-slate-400 font-medium">Memuatkan maklumat pangkalan data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 1. USERS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-grow">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama, e-mel, WhatsApp atau Telegram..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Semua Peranan</option>
                    <option value="owner">Pemilik Perniagaan</option>
                    <option value="affiliate">Ejen Affiliate</option>
                  </select>
                </div>

                {/* List/Table */}
                {filteredUsers.length === 0 ? (
                  <div className="bg-slate-950/20 border border-slate-800/60 rounded-2xl py-16 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold">Tiada pengguna ditemui.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((item) => {
                      const userOffers = offers.filter(o => o.ownerId === item.uid);
                      const hasOffers = userOffers.length > 0;
                      
                      return (
                        <div 
                          key={item.uid}
                          className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition-colors flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex flex-wrap gap-1.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                  item.role === 'owner' 
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' 
                                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {item.role === 'owner' ? 'Pemilik Perniagaan' : 'Ejen Affiliate'}
                                </span>
                                {hasOffers && item.role !== 'owner' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20" title="Ahli ini juga mendaftarkan tawaran komisen">
                                    + Pemilik Perniagaan
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 flex items-center font-mono">
                                <Calendar className="w-3 h-3 mr-1" />
                                {item.createdAt ? item.createdAt.toLocaleDateString('ms-MY') : '-'}
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-white mb-1 line-clamp-1">{item.displayName}</h4>
                            
                            <div className="space-y-1.5 mt-3 text-xs text-slate-400 font-medium">
                              <p className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">{item.email}</span>
                              </p>
                              {item.whatsapp && (
                                <p className="flex items-center gap-2">
                                  <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>{item.whatsapp}</span>
                                </p>
                              )}
                              {item.telegram && (
                                <p className="flex items-center gap-2">
                                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="font-mono text-[11px] text-slate-300">{item.telegram}</span>
                                </p>
                              )}
                            </div>

                            {/* Offers Count Label */}
                            {hasOffers && (
                              <div className="mt-4 p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs flex items-center justify-between">
                                <span className="text-slate-400 font-medium">Tawaran Perniagaan:</span>
                                <span className="text-amber-400 font-black">{userOffers.length} Produk Aktif</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-5 pt-3 border-t border-slate-900/80 flex items-center justify-between gap-2">
                            <span className="text-[9px] font-mono text-slate-600 truncate max-w-[80px]" title={item.uid}>
                              ID: {item.uid.substring(0, 8)}...
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleStartEditUser(item)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                title="Edit Maklumat Ahli"
                              >
                                <Edit className="w-3.5 h-3.5 text-amber-500" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemoveUser(item.uid, item.displayName)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-950/45 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Padam
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. OFFERS TAB */}
            {activeTab === 'offers' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-grow">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari tajuk, kategori, nama pemilik..."
                      value={offerSearch}
                      onChange={(e) => setOfferSearch(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <select
                    value={offerStatusFilter}
                    onChange={(e) => setOfferStatusFilter(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Semua Status</option>
                    <option value="aktif">Aktif</option>
                    <option value="tamat">Tamat</option>
                  </select>
                </div>

                {/* Grid */}
                {filteredOffers.length === 0 ? (
                  <div className="bg-slate-950/20 border border-slate-800/60 rounded-2xl py-16 text-center text-slate-500">
                    <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold">Tiada tawaran komisen ditemui.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOffers.map((offer) => (
                      <div key={offer.id} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between">
                        <div>
                          {/* Banner preview */}
                          <div className="w-full h-36 bg-slate-900 overflow-hidden flex items-center justify-center relative">
                            {offer.productImageUrl ? (
                              <img src={offer.productImageUrl} alt={offer.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-700 gap-1 text-center p-4">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">KomisyenHub</span>
                              </div>
                            )}
                            <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-widest ${
                              offer.status === 'aktif' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {offer.status === 'aktif' ? 'Aktif' : 'Tamat'}
                            </span>
                          </div>

                          <div className="p-4">
                            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide">
                              {offer.category}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-2 mb-1.5 line-clamp-1">{offer.title}</h4>
                            <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-3">{offer.description}</p>
                            
                            {/* Commission info */}
                            <div className="bg-slate-950/60 p-2.5 rounded-xl text-xs border border-slate-800/60 mb-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500 font-bold uppercase">KOMISEN</span>
                                <span className="font-extrabold text-amber-400 text-sm">
                                  {offer.commissionType === 'percentage' ? `${offer.commissionAmount}%` : `RM ${offer.commissionAmount.toFixed(2)}`}
                                </span>
                              </div>
                              <div className="mt-1.5 pt-1.5 border-t border-slate-800/50 flex justify-between text-[10px] text-slate-500">
                                <span>Pemilik:</span>
                                <span className="text-slate-300 font-bold truncate max-w-[150px]">{offer.ownerName}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-slate-900/60">
                          <a
                            href={offer.productUrl}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="inline-flex items-center text-[10px] font-bold text-slate-400 hover:text-amber-400 transition-colors gap-1"
                          >
                            Laman Jualan <ExternalLink className="w-3 h-3" />
                          </a>
                          
                          <button
                            onClick={() => handleRemoveOffer(offer.id, offer.title)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-950/45 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Padam
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. ADMINS TAB */}
            {activeTab === 'admins' && (
              <div className="space-y-6">
                {/* Add Admin Form */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-amber-500" />
                    Tambah Pentadbir Baru
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Masukkan e-mel individu yang ingin anda lantik sebagai Pentadbir (Admin). Mereka akan mendapat akses penuh ke Panel Pentadbir ini apabila melayari platform dengan e-mel tersebut.
                  </p>
                  
                  <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Masukkan alamat e-mel pentadbir baru..."
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                      required
                    />
                    <button
                      type="submit"
                      disabled={addingAdmin}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-sm font-bold rounded-xl transition-all gap-1.5 cursor-pointer shrink-0"
                    >
                      {addingAdmin ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Menambah...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Lantik Admin
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Admins List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Senarai Semua Pentadbir</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Admin (Hardcoded or Owner) */}
                    <div className="bg-slate-950/40 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between shadow-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-1.5">
                            rafsha92@gmail.com
                            <span className="bg-amber-500 text-slate-950 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Utama</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">Pentadbir asal / pencipta sistem</p>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Admins list */}
                    {admins.map((adm) => (
                      <div key={adm.email} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">{adm.email}</p>
                            <p className="text-[10px] text-slate-500 font-medium">Ditambah oleh {adm.addedBy} pada {adm.createdAt?.toLocaleDateString('ms-MY')}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveAdmin(adm.email)}
                          className="p-2 bg-red-950/45 hover:bg-red-900/60 border border-red-900/40 text-red-400 rounded-xl transition-all cursor-pointer"
                          title="Gugurkan akses admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-500" />
              Edit Maklumat Ahli
            </h3>
            
            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nama Penuh
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  E-mel (Tidak Boleh Diubah)
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  className="w-full bg-slate-950/40 border border-slate-850/60 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
                  disabled
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  No. WhatsApp
                </label>
                <input
                  type="text"
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  placeholder="cth: +60123456789"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Username Telegram
                </label>
                <input
                  type="text"
                  value={editTelegram}
                  onChange={(e) => setEditTelegram(e.target.value)}
                  placeholder="cth: @username"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Peranan Utama
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value={UserRole.AFFILIATE}>Ejen Affiliate</option>
                  <option value={UserRole.OWNER}>Pemilik Perniagaan</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
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
