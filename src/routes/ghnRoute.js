import express from 'express'
import { ghnController } from '~/controllers/ghnController'

const Router = express.Router()

Router.route('/provinces').get(ghnController.getProvinces)
Router.route('/districts').get(ghnController.getDistricts)
Router.route('/wards').get(ghnController.getWards)

export const ghnRoute = Router
