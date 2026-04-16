export type Category = 'Seguridad' | 'Comercio' | 'Social' | 'Avisos';

export type UserRole = 'User' | 'Business' | 'Admin';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  address_verified: boolean;
  role: UserRole;
  is_active: boolean;
  dob?: string;
  created_at: string;
}

export type FriendshipStatus = 'Pending' | 'Accepted' | 'Blocked';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  friend?: Profile; // Para cuando traemos la data del amigo
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  category: Category;
  location?: string;
  created_at: string;
  author?: Profile;
  likes?: Like[];
  comments?: Comment[];
  likes_count?: number;
  comments_count?: number;
  has_liked?: boolean;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface Incident {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'Reportado' | 'En Proceso' | 'Resuelto';
  photo_url?: string;
  location?: string;
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  description: string;
  banner_url?: string;
  payment_status: 'Pending' | 'Paid' | 'Expired';
  created_at: string;
  expires_at?: string;
  owner?: Profile;
}

export interface Payment {
  id: string;
  business_id: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Failed';
  created_at: string;
  expires_at?: string;
}
