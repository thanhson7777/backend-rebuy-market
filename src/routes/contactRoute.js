import express from 'express'
import { contactController } from '~/controllers/contactController'
import { contactValidation } from '~/validations/contactValidation'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()
Router.route('/')
  .get(contactController.getContacts)
  .post(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    contactValidation.createNew,
    contactController.createNew
  )

Router.route('/public')
  .post(
    contactValidation.createNew,
    contactController.createNew
  )

Router.route('/:id')
  .put(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    contactValidation.update,
    contactController.update
  )
  .delete(
    authMiddleware.isAuthorized,
    authMiddleware.isAuthorizedAdmin,
    contactController.deleteItem
  )

export const contactRoute = Router
