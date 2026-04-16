export type Category = 'Seguridad' | 'Comercio' | 'Social' | 'Avisos';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
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
  location_lat?: number;
  location_long?: number;
  created_at: string;
  author?: Profile;
  comment_count: number;
  reaction_count: number;
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
