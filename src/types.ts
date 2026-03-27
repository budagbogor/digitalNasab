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
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NewFamilyMember = Omit<FamilyMember, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
