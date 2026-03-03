import { env } from '~/config/enviroment'

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEM_PER_PAGE = 10

export const USER_ROLE = {
  ADMIN: 'admin',
  CLIENT: 'client'
}


export const PAYMENT_METHOD = {
  COD: 'COD',
  MOMO: 'MOMO',
  VNPAY: 'VNPAY'
}

export const STATUS_PAYMENT = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
}

export const STATUS_ORDER = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
}

export const STATUS_PRODUCT = {
  SOLD: 'sold',
  AVAILABLE: 'available',
  HIDDEN: 'hidden'
}

export const STATUS_CONTACT = {
  NEW: 'NEW',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  SPAM: 'SPAM'
}

export const WHITELIST_DOMAINS = [
  'http://localhost:5173'
]

export const WEBSITE_DOMAIN = (env.BUILD_MODE === 'production') ? env.WEBISTE_DOMAIN_PRODUCTION : env.WEBISTE_DOMAIN_DEVELOPMENT
