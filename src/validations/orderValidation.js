import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { PAYMENT_METHOD } from '~/utils/constants'
import { PHONE_RULE, OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validator'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    shippingAddress: Joi.object({
      fullname: Joi.string().required().min(2).trim().strict(),
      phone: Joi.string().required().pattern(PHONE_RULE),
      address: Joi.string().required().min(5),
      province: Joi.string().required().trim(),
      district: Joi.string().required().trim(),
      // ward: Joi.string().required().trim(),
      // district_id: Joi.number().required(),
      // ward_code: Joi.string().required(),
      note: Joi.string().allow('').optional()
    }).required(),

    paymentMethod: Joi.string().required().valid(...Object.values(PAYMENT_METHOD))
      .default(PAYMENT_METHOD.COD),

    couponCode: Joi.string().allow(null, '').optional(),
    couponId: Joi.string().pattern(OBJECT_ID_RULE).optional(),

    shippingFee: Joi.number().min(0).required(),
    totalProductPrice: Joi.number().min(0).required()
  })

  try {
    const validatedData = await correctCondition.validateAsync(req.body, { abortEarly: false, stripUnknown: true })
    req.body = validatedData
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const checkOrderId = async (req, res, next) => {
  const condition = Joi.object({
    id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  })
  try {
    await condition.validateAsync(req.params)
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const previewShippingFee = async (req, res, next) => {
  const condition = Joi.object({
    province: Joi.string().required().trim(),
    district: Joi.string().required().trim()
  })
  try {
    const validatedData = await condition.validateAsync(req.body, { abortEarly: false, stripUnknown: true })
    req.body = validatedData
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

export const orderValidation = { createNew, checkOrderId, previewShippingFee }