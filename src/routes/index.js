import express from 'express'
import { userRoute } from './UserRoute'
import { categoryRoute } from './categoryRoute'
import { productRoute } from './ProductRoute'

const Router = express.Router()

Router.use('/users', userRoute)
Router.use('/categories', categoryRoute)
Router.use('/products', productRoute)

export const APIS_V1 = Router