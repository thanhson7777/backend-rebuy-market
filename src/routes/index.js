import express from 'express'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.end('<h1>Xin Chao</h1>')
})

export const APIS_V1 = Router