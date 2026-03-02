import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    name: Joi.string().required().min(3).max(100).trim().strict().messages({
      'any.required': 'Tên là bắt buộc',
      'string.empty': 'Tên không được để trống',
      'string.min': 'Tên phải có từ 3 kí tự trở lên',
      'string.max': 'Tên phải ít hơn 100 ký tự',
      'string.trim': 'Tên không được để khoảng trắng ở đầu và cuối'
    }),
    summary: Joi.string().trim().max(300).required(),
    content: Joi.string().trim().required(),
    status: Joi.string().valid('draft', 'published', 'hidden').default('draft')
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false, allowUnknown: true })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const update = async (req, res, next) => {
  const correctCodition = Joi.object({
    name: Joi.string().min(3).max(100).trim().strict(),
    summary: Joi.string().trim().max(300),
    content: Joi.string().trim(),
    status: Joi.string().valid('draft', 'published', 'hidden')
  })

  try {
    await correctCodition.validateAsync(req.body, { abortEarly: false, allowUnknown: true })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

export const articleValidation = {
  createNew,
  update
}
