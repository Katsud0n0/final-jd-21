
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
  priority?: 'low' | 'medium' | 'high';
  completedBy?: string[];
}
