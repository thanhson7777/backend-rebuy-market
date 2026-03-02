import express from 'express'
import { articleValidation } from '~/validations/articleValidation'
import { articleController } from '~/controllers/articleController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
import { productFormDataMiddleware } from '~/middlewares/productFormDataMiddleware'

const Router = express.Router()
Router.route('/')
  .get(articleController.getArticles)
  .post(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    multerUploadMiddleware.uploadMulter.single('image'),
    productFormDataMiddleware.transformFormData,
    articleValidation.createNew,
    articleController.createNew
  )

Router.route('/:id')
  .put(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    multerUploadMiddleware.uploadMulter.single('image'),
    productFormDataMiddleware.transformFormData,
    articleValidation.update,
    articleController.update
  )
  .delete(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    articleController.deleteItem
  )

export const articleRoute = Router
