import express from 'express'
import { orderValidation } from '~/validations/orderValidation'
import { orderController } from '~/controllers/orderController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/')
  .post(
    authMiddleware.isAuthorized,
    orderValidation.createNew,
    orderController.createNew
  )

Router.route('/me').get(
  authMiddleware.isAuthorized,
  orderController.getMyOrders
)

Router.route('/admin').get(
  authMiddleware.isAuthorized,
  authMiddleware.isAuthorizedAdmin,
  orderController.getAdminOrders
)

Router.route('/admin/:id/status').patch(
  authMiddleware.isAuthorized,
  authMiddleware.isAuthorizedAdmin,
  orderValidation.checkOrderId,
  orderController.updateOrderStatus
)

Router.route('/:id/cancel').put(
  authMiddleware.isAuthorized,
  orderValidation.checkOrderId,
  orderController.cancelOrder
)

Router.route('/calculate-shipping').post(
  authMiddleware.isAuthorized,
  orderValidation.previewShippingFee,
  orderController.previewShippingFee
)

export const orderRoute = Router