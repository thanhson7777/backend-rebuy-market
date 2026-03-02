import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const transformFormData = (req, res, next) => {
  try {
    if (req.body.basePrice) {
      req.body.basePrice = Number(req.body.basePrice)
    }
    if (req.body.specs && typeof req.body.specs === 'string') {
      req.body.specs = JSON.parse(req.body.specs)
    }
    if (req.body.variants && typeof req.body.variants === 'string') {
      req.body.variants = JSON.parse(req.body.variants)
    }
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, 'Chuỗi JSON không hợp lệ trong FormData'))
  }
}

export const productFormDataMiddleware = { transformFormData }