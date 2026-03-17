import { env } from '~/config/enviroment'

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEM_PER_PAGE = 10

export const WHITELIST_DOMAINS = [
  'http://localhost:5173'
]

export const WEBSITE_DOMAIN = (env.BUILD_MODE === 'production') ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT
