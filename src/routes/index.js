import express from 'express'
import { userRoute } from './UserRoute'
import { categoryRoute } from './categoryRoute'
import { productRoute } from './productRoute'
import { couponRoute } from './couponRoute'
import { cartRoute } from './cartRoute'

const Router = express.Router()

Router.use('/users', userRoute)
Router.use('/categories', categoryRoute)
Router.use('/products', productRoute)
Router.use('/coupons', couponRoute)
Router.use('/cart', cartRoute)

export const APIS_V1 = Router