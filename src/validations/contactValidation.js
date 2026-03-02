import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE } from '~/utils/validator'
import { STATUS_CONTACT } from '~/utils/constants'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    fullname: Joi.string().required().min(3).max(100).trim().strict(),
    email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE).trim().strict(),
    phone: Joi.string().required().pattern(PHONE_RULE).message(PHONE_RULE_MESSAGE).trim().strict(),
    message: Joi.string().required().min(10).max(1000).trim().strict(),
    status: Joi.string().valid(...Object.values(STATUS_CONTACT)).default(STATUS_CONTACT.NEW),
    adminNotes: Joi.string().trim().optional().allow(null, '').default('')
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
    fullname: Joi.string().min(3).max(100).trim().strict(),
    email: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE).trim().strict(),
    phone: Joi.string().pattern(PHONE_RULE).message(PHONE_RULE_MESSAGE).trim().strict(),
    message: Joi.string().min(10).max(1000).trim().strict(),
    status: Joi.string().valid(...Object.values(STATUS_CONTACT)),
    adminNotes: Joi.string().trim().optional().allow(null, '').default('')
  })

  try {
    await correctCodition.validateAsync(req.body, { abortEarly: false, allowUnknown: true })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

export const contactValidation = {
  createNew,
  update
}
