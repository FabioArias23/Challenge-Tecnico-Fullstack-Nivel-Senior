export interface Service {
  id: number;
  customerId: number;
  amount: number;
  serviceDate: string;
}

export interface Pending {
  id: number;
  amount: string;
  status: 'PENDING' | 'INVOICED';
  service: Service;
}

export interface CreateBatchResponse {
  message: string;
  jobId: number;
  status: string;
  info?: string;
}

export interface AuthResponse {
  accessToken: string;
}