import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validator'

const createCoupon = async (req, res, next) => {
  const correctCondition = Joi.object({
    code: Joi.string().required().uppercase().trim().min(3).max(50),
    name: Joi.string().required().min(5).max(100),
    discount: Joi.object({
      type: Joi.string().valid('PERCENT', 'FIXED').required(),
      value: Joi.number().min(1).when('type', {
        is: 'PERCENT',
        then: Joi.number().max(100).messages({ 'number.max': 'Phần trăm giảm giá không được vượt quá 100%' })
      }).required(),
      maxAmount: Joi.number().min(0).allow(null),
      minOrder: Joi.number().min(0)
    }).required(),
    quantity: Joi.number().integer().min(1).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    isActive: Joi.boolean()
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false, stripUnknown: true })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const applyCoupon = async (req, res, next) => {
  const correctCondition = Joi.object({
    code: Joi.string().required(),
    totalOrderValue: Joi.number().required().min(0)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false, stripUnknown: true })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateCoupon = async (req, res, next) => {
  const correctCondition = Joi.object({
    code: Joi.string().uppercase().trim().min(3).max(50),
    name: Joi.string().min(5).max(100), // Bổ sung
    discount: Joi.object({
      type: Joi.string().valid('PERCENT', 'FIXED'),
      value: Joi.number().min(1).when('type', {
        is: 'PERCENT',
        then: Joi.number().max(100).messages({ 'number.max': 'Phần trăm giảm giá không được vượt quá 100%' })
      }),
      maxAmount: Joi.number().min(0).allow(null),
      minOrder: Joi.number().min(0)
    }),
    quantity: Joi.number().integer().min(0),
    startDate: Joi.date(),
    endDate: Joi.date().greater(Joi.ref('startDate')),
    isActive: Joi.boolean()
  })

  const conditionParams = Joi.object({
    couponId: Joi.string().required().pattern(OBJECT_ID_RULE).messages({
      'string.pattern.base': OBJECT_ID_RULE_MESSAGE
    })
  })

  try {
    await conditionParams.validateAsync(req.params)
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: false
    })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const deleteCoupon = async (req, res, next) => {
  const correctCondition = Joi.object({
    couponId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  })

  try {
    await correctCondition.validateAsync(req.params)
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const checkConpouId = async (req, res, next) => {
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

export const couponValidation = {
  createCoupon,
  applyCoupon,
  updateCoupon,
  deleteCoupon,
  checkConpouId
}
