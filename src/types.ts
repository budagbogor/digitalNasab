export type UserRole = 'admin' | 'viewer';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  ownerId: string;
  fullName: string;
  gender: 'male' | 'female';
  isAlive: boolean;
  birthDate?: string;
  deathDate?: string;
  address?: string;
  parentId?: string;
  motherId?: string;
  spouseId?: string;
  photoUrl?: string;
  phone?: string;
  occupation?: string;
  education?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalSettings {
  id: string;
  aiProvider: 'gemini' | 'sumopod';
  sumopodApiKey?: string;
  updatedAt: string;
}

export type NewFamilyMember = Omit<FamilyMember, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
