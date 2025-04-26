export interface Request {
  id: string;
  title: string;
  department: string | string[];
  departments?: string[];
  dateCreated: string;
  status: string;
  creator: string;
  creatorDepartment?: string;
  description?: string;
  type: string;
  expirationDate?: string;
  archived?: boolean;
  archivedAt?: string;
  createdAt?: string;
  lastStatusUpdate?: string;
  acceptedBy?: string[] | string;
  isExpired?: boolean;
  lastStatusUpdateTime?: string;
  usersNeeded?: number;
  usersAccepted?: number;
  participantsCompleted?: string[];
  multiDepartment?: boolean;
  statusChangedBy?: string;
  priority?: string;
  relatedProject?: string | null;
}

export interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
}
