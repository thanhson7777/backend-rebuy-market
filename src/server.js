/* eslint-disable no-console */
import express from 'express'
import exitHook from 'async-exit-hook'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from './config/enviroment'
import { APIS_V1 } from './routes'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions } from './config/cors'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const START_SERVER = () => {
  const app = express()
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  app.use(cookieParser())
  app.use(cors(corsOptions))

  app.use(express.json())

  app.use('/', APIS_V1)
  app.use(errorHandlingMiddleware)

  app.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
    console.log(`Xin chào ${env.AUTHOR}, Backend đang chạy thành công trên cổng: http://${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}/ `)
  })

  exitHook(() => {
    console.log('Server đang tắt')
    CLOSE_DB()
    console.log('Server đã tắt')
  })
}

(async () => {
  try {
    console.log('Đang kết nối tới mongoDB')
    await CONNECT_DB()
    console.log('Đã kêt nối tới mongoDB')
    START_SERVER()
  } catch (error) {
    console.log(error)
    process.exit(0)
  }
})()
