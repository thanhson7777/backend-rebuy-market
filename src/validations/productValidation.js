import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validator'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    categoryId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    name: Joi.string().required().min(3).max(100).trim().strict().messages({
      'any.required': 'Tên là bắt buộc',
      'string.empty': 'Tên không được để trống',
      'string.min': 'Tên phải có từ 3 kí tự trở lên',
      'string.max': 'Tên phải ít hơn 100 ký tự',
      'string.trim': 'Tên không được để khoảng trắng ở đầu và cuối'
    }),
    sku: Joi.string().trim().optional().allow(null, ''),
    price: Joi.number().min(0).required(),

    // Bổ sung validate cho thông tin giao hàng GHN
    weight: Joi.number().min(1).required().messages({
      'any.required': 'Trọng lượng là bắt buộc',
      'number.min': 'Trọng lượng phải lớn hơn 0'
    }),
    length: Joi.number().min(1).required().messages({
      'any.required': 'Chiều dài là bắt buộc',
      'number.min': 'Chiều dài phải lớn hơn 0'
    }),
    width: Joi.number().min(1).required().messages({
      'any.required': 'Chiều rộng là bắt buộc',
      'number.min': 'Chiều rộng phải lớn hơn 0'
    }),
    height: Joi.number().min(1).required().messages({
      'any.required': 'Chiều cao là bắt buộc',
      'number.min': 'Chiều cao phải lớn hơn 0'
    }),

    defects: Joi.string().trim().optional().allow(null, ''),
    description: Joi.string().trim().optional().allow(null, ''),
    image: Joi.alternatives().try(Joi.array().items(Joi.string().trim()), Joi.string().trim()).optional().allow(null, '')
  })

  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      stripUnknown: true
    })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const update = async (req, res, next) => {
  // không cần required khi update
  const correctCondition = Joi.object({
    categoryId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    name: Joi.string().min(3).max(100).trim().strict().messages({
      'string.empty': 'Tên không được để trống',
      'string.min': 'Tên phải có từ 3 kí tự trở lên',
      'string.max': 'Tên phải ít hơn 100 ký tự',
      'string.trim': 'Tên không được để khoảng trắng ở đầu và cuối'
    }),
    sku: Joi.string().trim().optional().allow(null, ''),
    price: Joi.number().min(0),
    weight: Joi.number().min(1).optional(),
    length: Joi.number().min(1).optional(),
    width: Joi.number().min(1).optional(),
    height: Joi.number().min(1).optional(),
    defects: Joi.string().trim().optional().allow(null, ''),
    description: Joi.string().trim().optional().allow(null, ''),
    image: Joi.alternatives().try(Joi.array().items(Joi.string().trim()), Joi.string().trim()).optional().allow(null, '')
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false, allowUnknown: true })
    next()
  } catch (error) { next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message)) }
}

const checkProductId = async (req, res, next) => {
  const condition = Joi.object({
    id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  })

  try {
    await condition.validateAsync(req.params)
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, error.message))
  }
}

export const productValidation = {
  createNew,
  update,
  checkProductId
}
