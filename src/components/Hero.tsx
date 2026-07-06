/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Briefcase, Users, FileText, Share2, HelpCircle, ShieldAlert, CheckCircle, ArrowRight, DollarSign } from 'lucide-react';
import { UserRole, UserProfile } from '../types';

interface HeroProps {
  onLogin: (preferredRole: UserRole) => void;
  userProfile?: UserProfile | null;
  onGoDashboard?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onLogin, userProfile, onGoDashboard }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqItems = [
    {
      q: "Adakah KomisenHub menjejaki klik atau jualan saya?",
      a: "Tidak. KomisenHub adalah direktori maklumat tawaran sahaja dan bukan platform penjejakan affiliate. Tiada pautan khas (referral links), kuki, atau kod pixel yang dijana atau dijejak oleh sistem ini."
    },
    {
      q: "Bagaimanakah cara ejen affiliate memulakan kerjasama?",
      a: "Ejen yang berdaftar boleh melayari senarai tawaran, melihat maklumat komisen, dan terus menghubungi pemilik perniagaan melalui maklumat perhubungan luar platform (seperti WhatsApp atau Telegram) yang dikongsikan oleh pemilik."
    },
    {
      q: "Bagaimanakah pembayaran komisen dilakukan?",
      a: "Semua pembayaran komisen diuruskan dan dibayar terus oleh pemilik perniagaan kepada ejen affiliate di luar platform KomisenHub mengikut persetujuan peribadi antara kedua-dua pihak."
    },
    {
      q: "Berapakah kos untuk menggunakan KomisenHub?",
      a: "Platform ini adalah 100% percuma untuk digunakan oleh pemilik perniagaan bagi menyenaraikan tawaran mereka, dan juga percuma untuk ejen affiliate yang ingin mencari peluang pendapatan."
    },
    {
      q: "Mengapakah senarai tawaran tidak dipaparkan secara umum?",
      a: "Bagi menjaga kualiti dan privasi maklumat perniagaan, direktori tawaran komisen kami dikawal dan hanya boleh diakses oleh ahli Affiliate berdaftar yang sah sahaja."
    }
  ];

  return (
    <div className="bg-slate-50" id="komisenhub-hero">
      {/* Main Hero Banner */}
      <div className="relative overflow-hidden py-20 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 tracking-wide uppercase mb-6 border border-blue-100">
              Direktori Tawaran Komisen Sulit Malaysia
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-bold text-slate-900 tracking-tight leading-tight mb-6">
              Hubungkan Produk Anda Dengan <span className="text-blue-600">Ejen Affiliate</span> Secara Terus
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-sans leading-relaxed mb-10">
              KomisenHub ialah direktori tertutup (private marketplace) bertulis untuk pemilik perniagaan berkongsi tawaran komisen mereka. Tiada pautan tracking, tiada pengiraan klik automatis—ejen berhubung terus dengan pemilik di luar sistem.
            </p>
 
            {userProfile ? (
              <div className="max-w-md mx-auto w-full">
                <button
                  onClick={onGoDashboard}
                  className="w-full inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
                  id="hero-btn-dashboard"
                >
                  <Briefcase className="w-5 h-5 mr-2 text-blue-100" />
                  Pergi Ke Dashboard Anda ({userProfile.role === UserRole.OWNER ? 'Pemilik Perniagaan' : 'Ejen Affiliate'})
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => onLogin(UserRole.OWNER)}
                  className="w-full sm:w-1/2 inline-flex items-center justify-center px-6 py-4 text-sm font-semibold rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all duration-200 group"
                  id="hero-btn-owner"
                >
                  <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                  Daftar/Masuk Pemilik Perniagaan (Cipta Posting)
                </button>
                <button
                  onClick={() => onLogin(UserRole.AFFILIATE)}
                  className="w-full sm:w-1/2 inline-flex items-center justify-center px-6 py-4 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 group"
                  id="hero-btn-affiliate"
                >
                  <Users className="w-5 h-5 mr-2 text-blue-100" />
                  Daftar/Masuk Ejen Affiliate (Lihat Posting)
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
            <div className="mt-5 text-center">
              <a
                href="#pricing"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all duration-200 underline underline-offset-4"
              >
                Lihat Pakej Harga &amp; Soalan Lazim
              </a>
            </div>
          </div>
        </div>
 
        {/* Decorative Grid Patterns */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
      </div>
 
      {/* Two Sides of Marketplace Section */}
      <div className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="cara-kerja">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-sans font-bold text-slate-900 tracking-tight">Perantara Maklumat Kerjasama Komisen</h2>
          <p className="text-slate-500 mt-2">Dua peranan penting dalam ekosistem perniagaan luar talian kami</p>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Business Owner Column */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
            <div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-6 border border-blue-100">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-sans font-bold text-slate-900 mb-4">Untuk Pemilik Perniagaan</h3>
              <p className="text-slate-600 leading-relaxed mb-6 text-sm">
                Mahu mengiklankan tawaran komisen anda kepada rangkaian pemasar digital tanpa sistem tracking yang rumit? Senaraikan tawaran produk, kadar komisen anda (tetap atau peratusan), dan biarkan ejen menghubungi anda terus di luar sistem.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-sm text-slate-600">
                  <span className="text-blue-500 mr-2.5 font-bold">✓</span>
                  Kawal penuh syarat kerjasama luar platform anda.
                </li>
                <li className="flex items-start text-sm text-slate-600">
                  <span className="text-blue-500 mr-2.5 font-bold">✓</span>
                  Bebas dari sebarang komplikasi integrasi API/Pixel teknikal.
                </li>
                <li className="flex items-start text-sm text-slate-600">
                  <span className="text-blue-500 mr-2.5 font-bold">✓</span>
                  Terima mesej terus daripada ejen yang berminat untuk berkerjasama.
                </li>
              </ul>
            </div>
            <button
              onClick={userProfile ? onGoDashboard : () => onLogin(UserRole.OWNER)}
              className="w-full py-3 px-6 text-sm font-semibold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200 border border-blue-100"
            >
              {userProfile ? 'Pergi Ke Dashboard Pemilik' : 'Urus Tawaran Anda (Log Masuk)'}
            </button>
          </div>
 
          {/* Affiliate Column */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
            <div>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-sans font-bold text-slate-900 mb-4">Untuk Ejen Affiliate</h3>
              <p className="text-slate-600 leading-relaxed mb-6 text-sm">
                Daftar masuk untuk mengakses direktori tertutup kami. Terokai pelbagai produk tempatan, semak kadar komisen tertinggi yang ditawarkan pemilik, simpan sebagai kegemaran, dan hubungi pemilik secara langsung untuk memulakan jualan.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-sm text-slate-600">
                  <span className="text-emerald-500 mr-2.5 font-bold">✓</span>
                  Akses maklumat tawaran eksklusif yang tidak dipaparkan secara umum.
                </li>
                <li className="flex items-start text-sm text-slate-600">
                  <span className="text-emerald-500 mr-2.5 font-bold">✓</span>
                  Hubungi pemilik perniagaan secara terus melalui WhatsApp atau Telegram.
                </li>
                <li className="flex items-start text-sm text-slate-600">
                  <span className="text-emerald-500 mr-2.5 font-bold">✓</span>
                  Simpan tawaran terbaik dalam senarai kegemaran anda untuk rujukan mudah.
                </li>
              </ul>
            </div>
            <button
              onClick={userProfile ? onGoDashboard : () => onLogin(UserRole.AFFILIATE)}
              className="w-full py-3 px-6 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              {userProfile ? 'Pergi Ke Dashboard Ejen' : 'Terokai Tawaran (Daftar Masuk)'}
            </button>
          </div>
        </div>
      </div>
 
      {/* Business Model / No Tracking Highlight */}
      <div className="bg-slate-100 py-16 border-t border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex p-3 bg-amber-50 text-amber-700 rounded-full border border-amber-200 mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-sans font-bold text-slate-900 mb-2">
            Polisi Tiada Penjejakan & Komisen Bebas Luar Sistem
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            KomisenHub **bukan** sebuah sistem penjejakan jualan affiliate. Kami tidak menjana pautan rujukan khas, tidak menjejaki klik, dan tidak memproses bayaran komisen. Seluruh proses pengiklanan, pembuktian jualan, dan pembayaran diuruskan secara peribadi (1-to-1) oleh pemilik perniagaan dan ejen di luar platform kami.
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-white py-16 sm:py-24 border-b border-slate-200" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 text-xs font-bold uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Pakej Harga
            </span>
            <h2 className="text-3xl font-sans font-bold text-slate-900 tracking-tight mt-3">
              Yuran Platform Yang Mudah & Telus
            </h2>
            <p className="text-slate-500 mt-2">Sesuai untuk semua pemilik produk dan usahawan pemasaran affiliate di Malaysia</p>
          </div>

          <div className="max-w-md mx-auto bg-slate-50 rounded-xl border border-slate-200 p-8 text-center hover:shadow-md transition-shadow duration-300">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-white px-3 py-1 rounded border border-slate-200">
              Pelan Akses Penuh
            </span>
            <div className="my-6">
              <span className="text-4xl sm:text-5xl font-sans font-black text-slate-900">RM 0</span>
              <span className="text-slate-500 text-sm"> / Seumur Hidup</span>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Nikmati akses tanpa had bagi kedua-dua peranan. Kami percaya perniagaan tempatan dan ejen affiliate harus mempunyai akses kepada maklumat tanpa halangan kewangan.
            </p>
            <div className="space-y-3 text-left border-t border-slate-200 pt-6 mb-8 text-sm text-slate-600">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Senaraikan tawaran komisen tanpa had</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Simpan senarai kegemaran tanpa had (Affiliate)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Butang hubungi terus WhatsApp / Telegram</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Bebas Yuran Peratusan Jualan (0% Comm Fee)</span>
              </div>
            </div>
            <button
              onClick={userProfile ? onGoDashboard : () => onLogin(UserRole.OWNER)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
            >
              {userProfile ? 'Masuk Ke Dashboard Sekarang' : 'Mula Daftar Percuma Sekarang'}
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-50 py-16 sm:py-24" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
          <div className="text-center mb-16">
            <span className="text-blue-600 text-xs font-bold uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              FAQ
            </span>
            <h2 className="text-3xl font-sans font-bold text-slate-900 tracking-tight mt-3">
              Soalan Lazim (FAQ)
            </h2>
            <p className="text-slate-500 mt-2">Dapatkan jawapan segera kepada persoalan anda berkenaan KomisenHub</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg transition-all overflow-hidden shadow-sm">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 font-bold text-sm text-slate-800 flex justify-between items-center hover:bg-slate-50 transition-colors focus:outline-none"
                  >
                    <span>{item.q}</span>
                    <span className="text-blue-500 text-lg font-bold">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="p-5 border-t border-slate-100 text-xs text-slate-600 leading-relaxed bg-slate-50">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
