import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(100).trim().strict().messages({
      'any.required': 'Tiêu đề là bắt buộc',
      'string.empty': 'Tiêu đề không được để trống',
      'string.min': 'Tiêu đề phải có từ 3 kí tự trở lên',
      'string.max': 'Tiêu đề phải ít hơn 100 ký tự',
      'string.trim': 'Tiêu đề không được để khoảng trắng ở đầu và cuối'
    }),
    image: Joi.alternatives().try(Joi.array().items(Joi.string().trim()), Joi.string().trim()).optional().allow(null, '')
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
    title: Joi.string().min(3).max(100).trim().strict(),
    image: Joi.alternatives().try(Joi.array().items(Joi.string().trim()), Joi.string().trim()).optional().allow(null, '')
  })

  try {
    await correctCodition.validateAsync(req.body, { abortEarly: false, allowUnknown: true })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

export const bannerValidation = {
  createNew,
  update
}
