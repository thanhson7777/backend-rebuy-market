import express from 'express'
import { userRoute } from './UserRoute'

const Router = express.Router()

Router.use('/users', userRoute)

export const APIS_V1 = Router