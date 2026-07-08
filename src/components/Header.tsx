/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut, User, Briefcase, Users, Shield } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface HeaderProps {
  userProfile: UserProfile | null;
  onLogin: (preferredRole: UserRole) => void;
  onLogout: () => void;
  onToggleRole?: () => void;
  onGoHome?: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ userProfile, onLogin, onLogout, onToggleRole, onGoHome, isAdmin }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200" id="komisenhub-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <div 
              onClick={(e) => {
                if (e.detail === 3) {
                  window.location.hash = '#admin';
                } else {
                  onGoHome?.();
                }
              }}
              className="flex items-center space-x-3 cursor-pointer select-none hover:opacity-90 transition-opacity"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-blue-900">
                  Komisen<span className="text-blue-600">Hub</span>
                </span>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">MARKETPLACE KOMISEN MALAYSIA</p>
              </div>
            </div>

            {/* Guest Nav Links */}
            {!userProfile && (
              <div className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
                <a href="#cara-kerja" className="hover:text-blue-600 transition-colors">Cara Kerja</a>
                <a href="#pricing" className="hover:text-blue-600 transition-colors">Pakej Harga</a>
                <a href="#faq" className="hover:text-blue-600 transition-colors">Soalan Lazim</a>
              </div>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {userProfile ? (
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Role Badge */}
                <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  userProfile.role === UserRole.OWNER
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {userProfile.role === UserRole.OWNER ? (
                    <>
                      <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                      Pemilik Perniagaan
                    </>
                  ) : (
                    <>
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      Ejen Komisyen (Affiliate)
                    </>
                  )}
                </span>

                {/* Switch Role Button */}
                {onToggleRole && (
                  <button
                    onClick={onToggleRole}
                    className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 shadow-xs shrink-0 ${
                      userProfile.role === UserRole.OWNER
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    }`}
                    title={userProfile.role === UserRole.OWNER ? 'Mendaftar / Tukar ke mod Ejen' : 'Mendaftar / Tukar ke mod Pemilik'}
                  >
                    {userProfile.role === UserRole.OWNER ? (
                      <>
                        <Users className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" />
                        <span>Tukar ke Ejen</span>
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" />
                        <span>Tukar ke Pemilik</span>
                      </>
                    )}
                  </button>
                )}

                {/* Profile Display */}
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800 line-clamp-1">{userProfile.displayName}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{userProfile.email}</p>
                </div>

                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                  <User className="w-5 h-5" />
                </div>

                {/* Admin Button */}
                {(userProfile.email === 'rafsha92@gmail.com' || isAdmin) && (
                  <button
                    onClick={() => window.location.hash = '#admin'}
                    className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors duration-200 border border-amber-200 bg-amber-50/50"
                    title="Panel Pentadbir"
                    id="btn-admin-panel"
                  >
                    <Shield className="w-5 h-5" />
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Log Keluar"
                  id="btn-logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => onLogin(UserRole.OWNER)}
                  className="inline-flex items-center justify-center px-3 py-2 bg-white hover:bg-slate-50 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 shadow-xs transition-all duration-200"
                  id="btn-login-owner"
                >
                  <Briefcase className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" />
                  <span className="hidden xs:inline">Log Masuk </span>Pemilik
                </button>
                <button
                  onClick={() => onLogin(UserRole.AFFILIATE)}
                  className="inline-flex items-center justify-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-200"
                  id="btn-login-affiliate"
                >
                  <Users className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" />
                  <span className="hidden xs:inline">Log Masuk </span>Ejen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
