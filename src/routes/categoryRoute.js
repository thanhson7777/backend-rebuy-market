import express from 'express'
import { categoryValidation } from '~/validations/categoryValidation'
import { categoryController } from '~/controllers/categoryController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
import { productFormDataMiddleware } from '~/middlewares/productFormDataMiddleware'

const Router = express.Router()
Router.route('/')
  .get(categoryController.getCategories)
  .post(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    multerUploadMiddleware.uploadMulter.single('image'),
    productFormDataMiddleware.transformFormData,
    categoryValidation.createNew,
    categoryController.createNew
  )

Router.route('/:id')
  .get(categoryController.getDetails)
  .put(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    multerUploadMiddleware.uploadMulter.single('image'),
    productFormDataMiddleware.transformFormData,
    categoryValidation.update,
    categoryController.update
  )
  .delete(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    categoryController.deleteItem
  )

export const categoryRoute = Router
