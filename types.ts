export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  key: string;  // R2 storage key
  url: string;  // Download URL
}

export interface DossierItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'ready';
  notes: string;
  attachmentUrl?: string; // Legacy - for backward compatibility
  attachments?: Attachment[]; // New - multiple file attachments
}

export interface Category {
  id: string;
  title: string;
  items: DossierItem[];
}

export interface AppState {
  categories: Category[];
}

export type ViewMode = 'manager' | 'inspector';
