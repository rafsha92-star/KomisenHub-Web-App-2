/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';
import { X, Mail, Lock, User, AlertCircle, Loader2, Briefcase, Users as UsersIcon, Smartphone } from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferredRole: UserRole | null;
  onShowStatus: (type: 'loading' | 'success' | 'error', title: string, message: string, autoCloseMs?: number) => void;
  onCloseStatus: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  preferredRole,
  onShowStatus,
  onCloseStatus
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Handle Sign In or Registration with Email/Password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (isRegisterMode && !fullName.trim()) {
      setErrorMsg('Sila masukkan nama penuh anda.');
      setLoading(false);
      return;
    }

    if (isRegisterMode && !whatsapp.trim()) {
      setErrorMsg('Sila masukkan no. telefon / WhatsApp anda.');
      setLoading(false);
      return;
    }

    if (isRegisterMode) {
      onShowStatus('loading', 'Mendaftar Akaun Baru...', 'Sila tunggu sebentar sementara kami mencipta akaun anda...');
    } else {
      onShowStatus('loading', 'Sedang Log Masuk...', 'Sila tunggu sebentar sementara kami mengesahkan maklumat anda...');
    }

    try {
      if (isRegisterMode) {
        // Store whatsapp temporarily in localStorage so App.tsx can retrieve it when creating profile
        localStorage.setItem('temp_whatsapp', whatsapp.trim());

        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update display name
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: fullName.trim()
          });
        }
        onShowStatus('success', 'Pendaftaran Berjaya!', 'Akaun anda telah berjaya didaftarkan. Selamat datang!', 2000);
      } else {
        // Sign in with email and password
        await signInWithEmailAndPassword(auth, email, password);
        onShowStatus('success', 'Log Masuk Berjaya!', 'Selamat kembali! Membuka papan pemuka anda...', 2000);
      }
      onClose(); // Close modal upon successful authentication
    } catch (error: any) {
      console.warn('Authentication scenario:', error);
      let friendlyError = '';
      // Friendly Melayu errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          friendlyError = 'E-mel ini telah digunakan oleh akaun lain.';
          break;
        case 'auth/invalid-email':
          friendlyError = 'Format alamat e-mel tidak sah.';
          break;
        case 'auth/weak-password':
          friendlyError = 'Kata laluan terlalu lemah. Sila gunakan sekurang-kurangnya 6 aksara.';
          break;
        case 'auth/wrong-password':
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          friendlyError = 'E-mel atau kata laluan salah.';
          break;
        case 'auth/popup-closed-by-user':
          friendlyError = 'Tetingkap log masuk Google ditutup sebelum selesai.';
          break;
        case 'auth/operation-not-allowed':
          friendlyError = 'Ralat: Kaedah daftar/masuk menggunakan E-mel & Kata Laluan tidak diaktifkan di Firebase Console anda. Sila pergi ke Firebase Console > Authentication > Sign-in method, aktifkan "Email/Password" untuk membenarkan pendaftaran ini.';
          break;
        default:
          friendlyError = error.message || 'Ralat sistem berlaku. Sila cuba lagi.';
      }
      setErrorMsg(friendlyError);
      onShowStatus('error', isRegisterMode ? 'Pendaftaran Gagal' : 'Log Masuk Gagal', friendlyError);
    } finally {
      setLoading(false);
    }
  };

  // Google sign in option inside modal
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    onShowStatus('loading', 'Menghubungkan ke Google...', 'Sila sahkan akaun anda di tetingkap yang dibuka...');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onShowStatus('success', 'Log Masuk Google Berjaya!', 'Selamat kembali! Membuka papan pemuka anda...', 2000);
      onClose();
    } catch (error: any) {
      console.warn('Google Auth Error:', error);
      let friendlyError = '';
      if (error.code === 'auth/popup-closed-by-user') {
        friendlyError = 'Tetingkap log masuk Google ditutup sebelum selesai. Sekiranya ini berlaku secara automatik, pelayar web anda mungkin menyekat pop-up di dalam iframe. Sila gunakan daftar/masuk menggunakan E-mel di bawah atau buka aplikasi ini di tab baru (Open in new tab).';
      } else if (error.code === 'auth/popup-blocked') {
        friendlyError = 'Pop-up disekat oleh pelayar web anda. Sila benarkan pop-up untuk laman web ini, gunakan daftar/masuk menggunakan E-mel, atau buka aplikasi ini di tab baru.';
      } else if (error.code === 'auth/unauthorized-domain') {
        friendlyError = `Domain ini (${window.location.hostname}) belum didaftarkan di Firebase Console. Sila tambah "${window.location.hostname}" ke dalam senarai "Authorized domains" di Firebase Console (Authentication > Settings > Authorized domains) untuk membenarkan log masuk di Netlify.`;
      } else if (error.code === 'auth/operation-not-allowed') {
        friendlyError = 'Ralat: Kaedah daftar/masuk menggunakan Google tidak diaktifkan di Firebase Console anda. Sila pergi ke Firebase Console > Authentication > Sign-in method, klik "Add new provider", pilih "Google", aktifkan dan simpan.';
      } else {
        friendlyError = `Gagal menyambung ke Google (${error.code || error.message}). Sekiranya anda di Netlify, pastikan anda telah menambah domain "${window.location.hostname}" ke senarai Authorized Domains di Firebase Console.`;
      }
      setErrorMsg(friendlyError);
      onShowStatus('error', 'Log Masuk Google Gagal', friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-sans font-bold text-slate-900">
                {isRegisterMode ? 'Daftar Akaun Baru' : 'Log Masuk REFERRA'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRegisterMode ? 'Sila isi maklumat anda di bawah.' : 'Selamat kembali ke portal anda.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Indicator Banner */}
          {preferredRole && (
            <div className={`mt-3 px-3 py-2 rounded-xl flex items-center gap-2 border text-xs font-semibold ${
              preferredRole === UserRole.OWNER
                ? 'bg-blue-50/70 border-blue-100 text-blue-700'
                : 'bg-emerald-50/70 border-emerald-100 text-emerald-700'
            }`}>
              {preferredRole === UserRole.OWNER ? (
                <>
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <span>Log Masuk / Daftar sebagai: <strong>Pemilik Perniagaan</strong> (Buat Posting)</span>
                </>
              ) : (
                <>
                  <UsersIcon className="w-4 h-4 shrink-0" />
                  <span>Log Masuk / Daftar sebagai: <strong>Ejen Affiliate</strong> (Tengok Posting)</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name (Only for Registration) */}
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Penuh *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama penuh anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat E-mel *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="contoh@emel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Laluan *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Minima 6 aksara"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* No. Telefon / WhatsApp (Only for Registration) */}
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  No. Telefon / WhatsApp *
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: +60123456789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : isRegisterMode ? (
                'Daftar Akaun Baru'
              ) : (
                'Log Masuk'
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="text-center text-xs text-slate-500">
            {isRegisterMode ? (
              <p>
                Sudah mempunyai akaun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setErrorMsg('');
                  }}
                  className="text-blue-600 font-bold hover:underline ml-1"
                >
                  Log Masuk Di Sini
                </button>
              </p>
            ) : (
              <p>
                Belum mempunyai akaun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMsg('');
                  }}
                  className="text-blue-600 font-bold hover:underline ml-1"
                >
                  Daftar Sekarang (Percuma)
                </button>
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-2">
            <div className="border-t border-slate-200 w-full absolute"></div>
            <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest relative">
              Atau
            </span>
          </div>

          {/* Google Login button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Log Masuk dengan Google
          </button>

        </div>
      </div>
    </div>
  );
};
