import express from 'express'
import { cartValidation } from '~/validations/cartValidation'
import { cartController } from '~/controllers/cartController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/')
  .get(
    authMiddleware.isAuthorized,
    cartController.getCart
  )


Router.route('/add')
  .post(
    authMiddleware.isAuthorized,
    cartValidation.addToCart,
    cartController.addToCart
  )

Router.route('/update')
  .put(
    authMiddleware.isAuthorized,
    cartValidation.updateCart,
    cartController.updateCart
  )

Router.route('/remove-item')
  .delete(
    authMiddleware.isAuthorized,
    cartValidation.deleteItem,
    cartController.deleteItem
  )

export const cartRoute = Router