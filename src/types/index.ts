import { User, Sector, Signature, Request, ChatMessage, SignatureAttachment, UserRole, RequestType, RequestStatus } from '@prisma/client'

// Tipos com relacionamentos
export type UserWithSector = User & {
  sector: Sector
}

export type SignatureWithRelations = Signature & {
  user: User
  sector: Sector
  attachments?: SignatureAttachment[]
}

export type RequestWithRelations = Request & {
  user: User
  signature: Signature
  respondedBy?: User
}

export type ChatMessageWithUsers = ChatMessage & {
  fromUser: User
  toUser: User
}

// Tipos para formulários
export interface CreateSignatureData {
  reason: string
  token: string
  attachments?: File[]
}

// Tipos para anexos
export interface AttachmentUploadData {
  file: File
  signatureId: string
}

export interface AttachmentResponse {
  id: string
  filename: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  downloadUrl: string
}

export interface CreateRequestData {
  type: RequestType
  signatureId: string
  reason: string
}

export interface CreateUserData {
  username: string
  name: string
  password: string
  role: UserRole
  sectorId: string
}

export interface CreateSectorData {
  name: string
  description?: string
}

export interface ChatMessageData {
  toUserId: string
  message: string
}

// Tipos para API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SignatureFilters extends PaginationParams {
  startDate?: string
  endDate?: string
  token?: string
  sectorId?: string
}

// Tipos para estatísticas
export interface DashboardStats {
  totalSignatures: number
  pendingRequests: number
  unreadMessages: number
  recentSignatures: SignatureWithRelations[]
}

export interface AdminStats {
  totalUsers: number
  totalSectors: number
  totalSignatures: number
  pendingRequests: number
  recentActivity: any[]
}

// Tipos para notificações
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
}

// Re-exportar tipos do Prisma
export type {
  User,
  Sector,
  Signature,
  Request,
  ChatMessage,
  SignatureAttachment,
  UserRole,
  RequestType,
  RequestStatus
}
