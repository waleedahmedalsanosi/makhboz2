export type UserRole = 'BUYER' | 'BAKER' | 'ADMIN'

export type ProductCategory = 'KAAK' | 'PETITFOUR' | 'BISCUIT' | 'MANIN'

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'DELIVERED' | 'CANCELLED'

export type PaymentStatus = 'AWAITING_PROOF' | 'PROOF_SUBMITTED' | 'VERIFIED' | 'REJECTED'

export interface User {
  id: string
  email: string
  password: string
  name: string
  phone?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  baker?: Baker
  orders?: Order[]
}

export interface Baker {
  id: string
  userId: string
  bio?: string
  area: string
  imageUrl?: string
  bankName?: string
  bankAccount?: string
  rating: number
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
  user: User
  products?: Product[]
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: ProductCategory
  area: string
  unit: string
  imageUrl?: string
  isAvailable: boolean
  bakerId: string
  createdAt: Date
  updatedAt: Date
  baker: Baker
  orderItems?: OrderItem[]
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentProofUrl?: string
  paymentNote?: string
  deliveryAddress: string
  total: number
  createdAt: Date
  updatedAt: Date
  user: User
  items: OrderItem[]
  review?: Review
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  order: Order
  product: Product
}

export interface Review {
  id: string
  orderId: string
  rating: number
  comment?: string
  createdAt: Date
  order: Order
}
