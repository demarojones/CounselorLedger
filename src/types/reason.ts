// Reason category and subcategory types
export interface ReasonCategory {
  id: string;
  name: string;
  color?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  subcategories?: ReasonSubcategory[];
}

export interface ReasonSubcategory {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Database response types for Supabase
export interface ReasonCategoryDbResponse {
  id: string;
  tenant_id: string;
  name: string;
  color?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ReasonSubcategoryDbResponse {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
