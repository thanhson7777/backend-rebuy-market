import express from 'express'
import { couponController } from '~/controllers/couponController'
import { couponValidation } from '~/validations/couponValidation'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/')
  .post(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    couponValidation.createCoupon,
    couponController.createCoupon
  )
  .get(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    couponController.getAllCoupons
  )

Router.route('/check')
  .post(
    authMiddleware.isAuthorized,
    couponValidation.applyCoupon,
    couponController.applyCoupon
  )

Router.route('/active')
  .get(
    authMiddleware.isAuthorized,
    couponController.getValidCoupons
  )

Router.route('/:couponId')
  .put(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    couponValidation.updateCoupon,
    couponController.updateCoupon
  ).delete(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    couponValidation.deleteCoupon,
    couponController.deleteCoupon
  )

export const couponRoute = Router
