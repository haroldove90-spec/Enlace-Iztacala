export type Category = 'Seguridad' | 'Comercio' | 'Social' | 'Avisos';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  address_verified: boolean;
  created_at: string;
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
