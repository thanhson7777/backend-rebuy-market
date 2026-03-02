import express from 'express'
import { bannerController } from '~/controllers/bannerController'
import { bannerValidation } from '~/validations/bannerValidation'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
import { productFormDataMiddleware } from '~/middlewares/productFormDataMiddleware'

const Router = express.Router()
Router.route('/')
  .get(bannerController.getBanners)
  .post(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    multerUploadMiddleware.uploadMulter.array('image', 10),
    productFormDataMiddleware.transformFormData,
    bannerValidation.createNew,
    bannerController.createNew
  )

Router.route('/:id')
  .put(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    multerUploadMiddleware.uploadMulter.array('image', 10),
    productFormDataMiddleware.transformFormData,
    bannerValidation.update,
    bannerController.update
  )
  .delete(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    bannerController.deleteItem
  )

export const bannerRoute = Router
