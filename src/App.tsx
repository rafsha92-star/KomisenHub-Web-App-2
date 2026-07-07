/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DashboardOwner } from './components/DashboardOwner';
import { DashboardAffiliate } from './components/DashboardAffiliate';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { 
  Briefcase, Users, Loader2, ArrowRight, ShieldCheck, 
  AlertCircle, Smartphone, ExternalLink 
} from 'lucide-react';

export default function App() {
  // Authentication & Profile states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'dashboard' | 'home'>('dashboard');

  // Role setup state (for first-time login)
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [preferredRole, setPreferredRole] = useState<UserRole | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // User logged in, let's fetch profile
        const path = `users/${currentUser.uid}`;
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              uid: data.uid,
              displayName: data.displayName,
              email: data.email,
              role: data.role as UserRole,
              whatsapp: data.whatsapp || '',
              telegram: data.telegram || '',
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            });
            setViewMode('dashboard');
            setShowRoleSelection(false);
          } else {
            // No profile found, trigger first-time role selection
            setShowRoleSelection(true);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      } else {
        setProfile(null);
        setShowRoleSelection(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Handle login action
  const handleLogin = (role?: UserRole) => {
    if (role) {
      setPreferredRole(role);
      setSelectedRole(role);
    } else {
      setPreferredRole(null);
      setSelectedRole(null);
    }
    setIsAuthModalOpen(true);
  };

  // 4. Handle logout action
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 5. Submit chosen role (Setup account)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setProfileError('Sila pilih jenis akaun anda.');
      return;
    }
    if (!user) return;

    setSavingProfile(true);
    setProfileError('');
    const path = `users/${user.uid}`;

    try {
      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Pengguna KomisenHub',
        email: user.email || '',
        role: selectedRole,
        whatsapp: whatsapp,
        telegram: telegram,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Write to Firestore users collection
      await setDoc(doc(db, 'users', user.uid), {
        uid: newProfile.uid,
        displayName: newProfile.displayName,
        email: newProfile.email,
        role: newProfile.role,
        whatsapp: newProfile.whatsapp || '',
        telegram: newProfile.telegram || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setProfile(newProfile);
      setViewMode('dashboard');
      setShowRoleSelection(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      setProfileError('Gagal melengkapkan pendaftaran profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Toggle / switch user role (allows dual registration / active-role swapping)
  const handleToggleRole = async () => {
    if (!user || !profile) return;
    
    const newRole = profile.role === UserRole.OWNER ? UserRole.AFFILIATE : UserRole.OWNER;
    setLoading(true);
    const path = `users/${user.uid}`;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      
      setProfile({
        ...profile,
        role: newRole,
        updatedAt: new Date(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setLoading(false);
    }
  };

  // Loading global state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 mt-4 font-sans">Menyambung ke KomisenHub...</p>
      </div>
    );
  }

  // First-time login: role & profile choosing screen
  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl">
          <div className="text-center mb-8">
            <span className="w-12 h-12 bg-blue-600 text-white font-bold text-2xl flex items-center justify-center rounded-2xl mx-auto mb-4">
              K
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-sans text-slate-900">
              Langkah Terakhir!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Sila pilih peranan anda di KomisenHub untuk meneruskan pendaftaran.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {profileError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {/* Role Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Owner */}
              <div
                onClick={() => setSelectedRole(UserRole.OWNER)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedRole === UserRole.OWNER
                    ? 'border-blue-600 bg-blue-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Pemilik Perniagaan</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Saya mahu menyenaraikan tawaran komisen perniagaan saya secara maklumat bertulis.
                  </p>
                </div>
              </div>

              {/* Option 2: Affiliate */}
              <div
                onClick={() => setSelectedRole(UserRole.AFFILIATE)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedRole === UserRole.AFFILIATE
                    ? 'border-blue-600 bg-blue-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ejen Affiliate / Awam</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Saya mahu meneroka pelbagai senarai tawaran komisen dan menghubungi pemilik secara langsung.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-slate-400" /> No. Telefon / WhatsApp (Sangat Disyorkan)
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: +60123456789"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" /> Username Telegram (Sangat Disyorkan)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: @username_anda"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Maklumat perhubungan ini membolehkan pemilik perniagaan dan ejen affiliate berhubung secara langsung di luar platform untuk memulakan kerjasama, memandangkan tiada sistem tracking automatik.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile || !selectedRole}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mendaftarkan...
                </>
              ) : (
                <>
                  Lengkapkan Pendaftaran
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isDashboardActive = !!(profile && viewMode === 'dashboard');

  // --- STANDARD COMPONENT DISPLAY ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="app-root">
      <div className={isDashboardActive ? "flex-grow flex flex-col h-screen overflow-hidden" : "flex-grow"}>
        {/* Top Header Navigation - Only on landing/home page */}
        {!isDashboardActive && (
          <Header 
            userProfile={profile} 
            onLogin={handleLogin} 
            onLogout={handleLogout} 
            onToggleRole={handleToggleRole}
            onGoHome={() => setViewMode('home')}
          />
        )}

        {/* Core Content */}
        <main className={isDashboardActive ? "flex-grow h-full overflow-hidden flex" : "flex-grow"}>
          {isDashboardActive ? (
            profile.role === UserRole.OWNER ? (
              <DashboardOwner userProfile={profile} onToggleRole={handleToggleRole} onLogout={handleLogout} />
            ) : (
              <DashboardAffiliate userProfile={profile} onToggleRole={handleToggleRole} onLogout={handleLogout} />
            )
          ) : (
            <Hero 
              onLogin={handleLogin} 
              userProfile={profile}
              onGoDashboard={() => setViewMode('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Footer copyright - Only on landing/home page */}
      {!isDashboardActive && <Footer />}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        preferredRole={preferredRole} 
      />
    </div>
  );
}
