import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const transformFormData = (req, res, next) => {
  try {
    // ép kiểu sang số
    if (req.body.basePrice) {
      req.body.basePrice = Number(req.body.basePrice)
    }

    // Frontend gửi JSON string -> Parse ra Object
    if (req.body.specs && typeof req.body.specs === 'string') {
      req.body.specs = JSON.parse(req.body.specs)
    }

    // Frontend gửi JSON string -> Parse ra Array
    if (req.body.variants && typeof req.body.variants === 'string') {
      req.body.variants = JSON.parse(req.body.variants)
    }

    // Xử lý xong thì cho đi tiếp
    next()
  } catch (error) {
    // Nếu JSON sai định dạng (ví dụ thiếu dấu ngoặc }, dấu phẩy...)
    next(new ApiError(StatusCodes.BAD_REQUEST, 'Chuỗi JSON không hợp lệ trong FormData'))
  }
}

export const productFormDataMiddleware = { transformFormData }