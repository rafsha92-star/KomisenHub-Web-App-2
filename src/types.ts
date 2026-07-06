/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  OWNER = 'owner',
  AFFILIATE = 'affiliate'
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  whatsapp?: string;
  telegram?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CommissionType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export interface Offer {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerWhatsapp?: string;
  ownerTelegram?: string;
  title: string;
  description: string;
  commissionAmount: number;
  commissionType: CommissionType;
  productUrl: string;
  category: string;
  status: 'aktif' | 'tamat';
  productImageUrl?: string; // Gambar produk (Opsional)
  contactInstructions?: string; // Cara ejen boleh hubungi pemilik (cth: WhatsApp saya dengan portfolio)
  createdAt: Date;
  updatedAt: Date;
}

export interface Favorite {
  id: string; // `${affiliateId}_${offerId}`
  affiliateId: string;
  offerId: string;
  createdAt: Date;
}

