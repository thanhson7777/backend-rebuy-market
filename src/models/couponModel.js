import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt', 'usedCount']
const COUPON_COLLECTION_NAME = 'coupons'
const COUPON_COLLECTION_SCHEMA = Joi.object({
  code: Joi.string().required().uppercase().trim().min(3).max(50),
  name: Joi.string().required().min(5).max(100),
  discount: Joi.object({
    type: Joi.string().valid('PERCENT', 'FIXED').default('FIXED'),
    value: Joi.number().min(1).when('type', {
      is: 'PERCENT',
      then: Joi.number().max(100).messages({ 'number.max': 'Phần trăm giảm giá không được vượt quá 100%' })
    }).required(),

    maxAmount: Joi.number().min(0).default(null).allow(null),
    minOrder: Joi.number().min(0).default(0)
  }).required(),

  quantity: Joi.number().integer().min(0).required(),
  usedCount: Joi.number().default(0),

  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),

  isActive: Joi.boolean().default(true),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await COUPON_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)

    const newCoupon = {
      ...validData
    }
    return await GET_DB().collection(COUPON_COLLECTION_NAME).insertOne(newCoupon)
  } catch (error) { throw new Error(error) }
}

const findByCode = async (code) => {
  try {
    return await GET_DB().collection(COUPON_COLLECTION_NAME).findOne({
      code: code.toUpperCase(),
      _destroy: false
    })
  } catch (error) { throw error }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(COUPON_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
  } catch (error) { throw new Error(error) }
}

const updateUsage = async (couponId) => {
  try {
    await GET_DB().collection(COUPON_COLLECTION_NAME).updateOne(
      { _id: couponId },
      { $inc: { quantity: -1, usedCount: 1 } }
    )
  } catch (error) { throw new Error(error) }
}

const getCoupons = async (query = {}) => {
  try {
    const finnalQuery = {
      ...query,
      _destroy: false
    }
    return await GET_DB().collection(COUPON_COLLECTION_NAME)
      .find(finnalQuery)
      .sort({ createdAt: -1 })
      .toArray()
  } catch (error) { throw new Error(error) }
}

const update = async (id, updateData) => {
  try {
    Object.keys(updateData).forEach(fielName => {
      if (INVALID_UPDATE_FIELDS.includes(fielName)) {
        delete updateData[fielName]
      }
    })

    updateData.updatedAt = Date.now()

    const result = await GET_DB().collection(COUPON_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(id)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) { throw error }
}

const deleteOne = async (id) => {
  try {
    const result = await GET_DB().collection(COUPON_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          _destroy: true,
          updatedAt: Date.now()
        }
      },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw error }
}

export const couponModel = {
  COUPON_COLLECTION_NAME,
  COUPON_COLLECTION_SCHEMA,
  createNew,
  findByCode,
  findOneById,
  updateUsage,
  getCoupons,
  update,
  deleteOne
}
