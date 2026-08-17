export interface UserSimple {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

export interface DrawingItem {
  id: number;
  tenant_id: string;
  project_id: number;
  title: string;
  drawing_number: string;
  file_path: string;
  file_url?: string;
  thumbnail_path?: string | null;
  thumbnail_url?: string;
  file_type: 'pdf' | 'dwg' | 'jpg' | 'png';
  version: string;
  revision_number: string;
  approval_status: 'draft' | 'under_review' | 'approved' | 'rejected';
  width?: number | null;
  height?: number | null;
  uploaded_by: number;
  uploader?: UserSimple;
  issues_count?: number;
  created_at: string;
}

export interface IssueAttachment {
  id: number;
  issue_id: number;
  file_path: string;
  file_url?: string;
  file_type: 'image' | 'video';
  stage: 'before' | 'after';
  latitude?: number | null;
  longitude?: number | null;
  taken_at?: string | null;
  uploaded_by: number;
  uploader?: UserSimple;
  created_at: string;
}

export interface IssueItem {
  id: number;
  tenant_id: string;
  project_id: number;
  drawing_id?: number | null;
  wbs_node_id?: number | null;
  activity_id?: number | null;
  issue_number: string;
  title: string;
  description?: string | null;
  pin_x?: number | null;
  pin_y?: number | null;
  location_description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  logged_at: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to_user_id?: number | null;
  assigned_user?: UserSimple | null;
  contractor_name?: string | null;
  due_date?: string | null;
  closed_at?: string | null;
  status: 'new' | 'in_progress' | 'pending_review' | 'closed';
  created_by: number;
  creator?: UserSimple | null;
  drawing?: DrawingItem | null;
  attachments?: IssueAttachment[];
  created_at: string;
}
