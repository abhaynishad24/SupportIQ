export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  created_at: string;
  created_by?: number | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  resolved_at?: string | null;
}