import express from 'express'
import { productValidation } from '~/validations/productValidation'
import { productController } from '~/controllers/productController'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
import { productFormDataMiddleware } from '~/middlewares/productFormDataMiddleware'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/')
  .get(productController.getProducts)

Router.route('/admin')
  .get(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    productController.getAdminProducts
  )
  .post(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    multerUploadMiddleware.uploadMulter.array('image', 5),
    productFormDataMiddleware.transformFormData,
    productValidation.createNew,
    productController.createNew
  )

Router.route('/admin/:id/restore')
  .put(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    productValidation.checkProductId,
    productController.restoreItem
  )

Router.route('/admin/:id/force')
  .delete(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    productValidation.checkProductId,
    productController.forceDeleteItem
  )

Router.route('/:id')
  .get(
    productValidation.checkProductId,
    productController.getDetails
  )
  .put(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    multerUploadMiddleware.uploadMulter.array('image', 5),
    productFormDataMiddleware.transformFormData,
    productValidation.checkProductId,
    productValidation.update,
    productController.update
  )
  .delete(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    productValidation.checkProductId,
    productController.deleteItem
  )

export const productRoute = Router