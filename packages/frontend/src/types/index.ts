export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN'

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELED'

export type HistoryAction =
  | 'CREATED'
  | 'UPDATED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELED'

export type AttachmentType = 'PDF' | 'JPG' | 'PNG'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export type Category = {
  id: string
  name: string
  active: boolean
  valueLimit?: number | string | null
  createdAt: string
  updatedAt: string
}

export type Attachment = {
  id: string
  requestId: string
  fileName: string
  fileUrl: string
  fileType: AttachmentType
  createdAt: string
}

export type Reimbursement = {
  id: string
  requesterId: string
  categoryId: string
  description: string
  amount: number | string
  expenseDate: string
  status: RequestStatus
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
  requester: Pick<User, 'id' | 'name' | 'email' | 'role'>
  category: Category
  attachments: Attachment[]
}

export type RequestHistory = {
  id: string
  requestId: string
  userId: string
  action: HistoryAction
  note?: string | null
  createdAt: string
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>
}

export type ApiError = {
  message: string
  statusCode?: number
  error?: string
  details?: Array<{ field: string; message: string }>
}

export type LoginResponse = {
  token: string
  refreshToken: string
  user: User
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginationMeta
}
