
export interface Request {
  id: string;
  title: string;
  description?: string;
  department: string;
  departments?: string[];
  status: string;
  dateCreated: string;
  creator: string;
  creatorDepartment?: string;
  createdAt?: string;
  type: "request" | "project";
  creatorRole?: string;
  isExpired?: boolean;
  archived?: boolean;
  multiDepartment?: boolean;
  acceptedBy?: string[] | string;
  participantsCompleted?: string[];
  usersAccepted?: number;
  usersNeeded?: number;
  lastStatusUpdateTime?: string;
  lastStatusUpdate?: string;
  priority?: 'low' | 'medium' | 'high';
  completedBy?: string[];
  statusChangedBy?: string;
  archivedAt?: string;
  rejections?: Rejection[];
}

export interface Rejection {
  username: string;
  reason: string;
  date: string;
  hidden?: boolean;
}

export interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  department: string;
  role: string;
  phone?: string;
}
