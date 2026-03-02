import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validator'
import { ObjectId } from 'mongodb'
import { PAYMENT_METHOD, STATUS_PAYMENT, STATUS_ORDER } from '~/utils/constants'
import { PHONE_RULE } from '~/utils/validator'

const ORDER_COLLECTION_NAME = 'orders'
const ORDER_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  shippingAddress: Joi.object({
    fullname: Joi.string().required().trim().min(2).max(100),
    address: Joi.string().required().min(5).max(255),
    phone: Joi.string().required().pattern(PHONE_RULE).message('Số điện thoại không hợp lệ!'),
    province: Joi.string().required().trim(),
    district: Joi.string().required().trim(),
    ward: Joi.string().required().trim(),
    district_id: Joi.number().required(),
    ward_code: Joi.string().required(),
    note: Joi.string().allow('').max(500).optional()
  }).required(),

  items: Joi.array().items(Joi.object({
    productId: Joi.string().pattern(OBJECT_ID_RULE).required(),
    name: Joi.string().required(),
    price: Joi.number().required(),
    defects: Joi.string().trim().default(null),
    image: Joi.array().items(Joi.string().trim()).default([])
  })).required(),

  payment: Joi.object({
    method: Joi.string().valid(...Object.values(PAYMENT_METHOD)).required(),
    status: Joi.string().valid(...Object.values(STATUS_PAYMENT)).default(STATUS_PAYMENT.PENDING),
    transactionId: Joi.string().default(null),
    paidAt: Joi.date().default(null)
  }).required(),

  totalProductPrice: Joi.number().required(),
  shippingFee: Joi.number().default(0),

  couponId: Joi.string().pattern(OBJECT_ID_RULE).allow(null).default(null),
  couponCode: Joi.string().allow(null, '').default(null),
  discountAmount: Joi.number().default(0),

  finalPrice: Joi.number().required(),

  status: Joi.string().valid(...Object.values(STATUS_ORDER)).default(STATUS_ORDER.PENDING),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null)
})

const createNew = async (data) => {
  try {
    const validData = await ORDER_COLLECTION_SCHEMA.validateAsync(data, {
      abortEarly: false,
      stripUnknown: true
    })

    const insertData = {
      ...validData,
      userId: new ObjectId(String(validData.userId)),
      items: validData.items.map(item => ({
        ...item,
        productId: new ObjectId(String(item.productId))
      }))
    }

    if (insertData.couponId) insertData.couponId = new ObjectId(String(insertData.couponId))

    return await GET_DB().collection(ORDER_COLLECTION_NAME).insertOne(insertData)
  } catch (error) { throw error }
}

const findOneById = async (orderId) => {
  try {
    return await GET_DB().collection(ORDER_COLLECTION_NAME).findOne({
      _id: new ObjectId(String(orderId))
    })
  } catch (error) { throw error }
}

const updatePaymentStatus = async (orderId, paymentData, orderStatus) => {
  try {
    const db = GET_DB().collection(ORDER_COLLECTION_NAME)
    const result = await db.findOneAndUpdate(
      { _id: new ObjectId(String(orderId)) },
      {
        $set: {
          'payment.status': paymentData.status,
          'payment.transactionId': paymentData.transactionId,
          'payment.bankCode': paymentData.bankCode,
          'payment.paidAt': paymentData.paidAt,
          status: orderStatus,
          updatedAt: Date.now()
        }
      },
      { returnDocument: 'after' }
    )
    return result || result.value
  } catch (error) { throw error }
}

const getAdminOrders = async ({ page, limit, status }) => {
  try {
    const skip = (page - 1) * limit
    let matchCondition = {}

    if (status && status !== 'ALL') {
      matchCondition = { status: status }
    }

    const db = await GET_DB()

    const [orders, totalOrders] = await Promise.all([
      db.collection(ORDER_COLLECTION_NAME)
        .find(matchCondition)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),

      db.collection(ORDER_COLLECTION_NAME).countDocuments(matchCondition)
    ])

    return {
      orders,
      pagination: {
        totalRecords: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
        limit: limit
      }
    }
  } catch (error) { throw error }
}

const updateOrderStatus = async (orderId, updateData) => {
  try {

    updateData.updatedAt = Date.now()
    const result = await GET_DB().collection(ORDER_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(orderId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result.value || result
  } catch (error) {
    throw error
  }
}

const getUserOrders = async (userId) => {
  try {
    const result = await GET_DB().collection(ORDER_COLLECTION_NAME)
      .find({ userId: new ObjectId(String(userId)) })
      .sort({ createdAt: -1 })
      .toArray()
    return result
  } catch (error) { throw error }
}

const update = async (orderId, updateData) => {
  try {
    const result = await GET_DB().collection(ORDER_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(orderId)) },
      { $set: { ...updateData, updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw error }
}

const countTotalOrders = async () => {
  try {
    return await GET_DB().collection(ORDER_COLLECTION_NAME).countDocuments()
  } catch (error) { throw error }
}

const calculateTotalRevenue = async () => {
  try {
    const result = await GET_DB().collection(ORDER_COLLECTION_NAME).aggregate([
      { $match: { status: 'DELIVERED' } },
      { $group: { _id: null, totalRevenue: { $sum: '$finalPrice' } } }
    ]).toArray()
    return result
  } catch (error) { throw error }
}

const getOrderStatusStats = async () => {
  try {
    return await GET_DB().collection(ORDER_COLLECTION_NAME).aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray()
  } catch (error) { throw error }
}

const getRevenueOverTime = async (targetDate) => {
  try {
    return await GET_DB().collection(ORDER_COLLECTION_NAME).aggregate([
      {
        $match: {
          status: 'DELIVERED',
          createdAt: { $gte: new Date(targetDate).getTime() }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$createdAt' } } },
          dailyRevenue: { $sum: '$finalPrice' } // 🌟 Đổi thành finalPrice
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray()
  } catch (error) { throw error }
}

const getRecentOrders = async (limitCount = 5) => {
  try {
    return await GET_DB().collection(ORDER_COLLECTION_NAME)
      .find({})
      .sort({ createdAt: -1 })
      .limit(limitCount)
      .project({
        'shippingAddress.fullname': 1,
        'shippingAddress.phone': 1,
        finalPrice: 1,
        status: 1,
        createdAt: 1
      })
      .toArray()
  } catch (error) { throw error }
}

export const orderModel = {
  ORDER_COLLECTION_NAME,
  ORDER_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  updatePaymentStatus,
  getAdminOrders,
  updateOrderStatus,
  getUserOrders,
  update,
  countTotalOrders,
  calculateTotalRevenue,
  getOrderStatusStats,
  getRevenueOverTime,
  getRecentOrders
}
