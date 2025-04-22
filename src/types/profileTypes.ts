
export interface Request {
  id: string;
  title: string;
  department: string;
  dateCreated: string;
  status: string;
  creator: string;
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
}

export interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
}
