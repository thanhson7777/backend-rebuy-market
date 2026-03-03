import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import {
  OBJECT_ID_RULE,
  OBJECT_ID_RULE_MESSAGE
} from '~/utils/validator'

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']
const CART_COLLECTION_NAME = 'carts'
const CART_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
      quantity: Joi.number().integer().min(1).default(1)
    }).unknown(true)
  ).default([]),
  totalPrice: Joi.number().default(0),
  couponId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).optional().allow(null).default(null),
  discountAmount: Joi.number().default(0),
  finalPrice: Joi.number().default(0),

  status: Joi.string().valid('active', 'completed', 'abandoned').default('active'),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null)
})

const validateBeforeCreate = async (data) => {
  return await CART_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)

    const newCart = {
      ...validData,
      userId: new ObjectId(String(validData.userId)),
      items: validData.items.map(item => ({
        ...item,
        productId: new ObjectId(String(item.productId))
      }))
    }
    return await GET_DB().collection(CART_COLLECTION_NAME).insertOne(newCart)
  } catch (error) { throw error }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(CART_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
  } catch (error) { throw error }
}

const findOneByUserId = async (userId) => {
  try {
    return await GET_DB().collection(CART_COLLECTION_NAME).findOne(
      {
        userId: new ObjectId(String(userId)),
        status: 'active'
      }
    )
  } catch (error) { throw error }
}

const update = async (cartId, updateData) => {
  try {
    Object.keys(updateData).forEach(fielName => {
      if (INVALID_UPDATE_FIELDS.includes(fielName)) {
        delete updateData[fielName]
      }
    })

    if (updateData.items && Array.isArray(updateData.items)) {
      updateData.items = updateData.items.map(item => ({
        ...item,
        productId: new ObjectId(String(item.productId))
      }))
    }

    if (updateData.couponId) {
      updateData.couponId = new ObjectId(String(updateData.couponId))
    }

    updateData.updatedAt = Date.now()

    const result = await GET_DB().collection(CART_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(cartId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw error }
}

const pushProductToCart = async (cartId, productItem) => {
  try {
    const result = await GET_DB().collection(CART_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(cartId)) },
      {
        $push: { products: productItem }
      },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw error }
}

const getCartDetail = async (userId) => {
  try {
    const db = await GET_DB()
    const result = await db.collection(CART_COLLECTION_NAME).aggregate([
      {
        $match: {
          userId: new ObjectId(String(userId)),
          status: 'active'
        }
      },
      {
        $unwind: {
          path: '$items',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: {
          path: '$productInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$_id',
          userId: { $first: '$userId' },
          totalPrice: { $first: '$totalPrice' },
          discountAmount: { $first: '$discountAmount' },
          finalPrice: { $first: '$finalPrice' },
          couponId: { $first: '$couponId' },

          items: {
            $push: {
              $cond: [
                { $ifNull: ['$items.productId', false] },
                {
                  productId: '$items.productId',
                  name: '$productInfo.name',
                  defects: '$productInfo.defects',
                  image: '$productInfo.image',
                  price: '$productInfo.price',
                  status: '$productInfo.status',
                  slug: '$productInfo.slug'
                },
                '$$REMOVE'
              ]
            }
          }
        }
      }
    ]).toArray()

    return result[0] || null
  } catch (error) { throw error }
}

const clearCart = async (userId) => {
  try {
    await GET_DB().collection(CART_COLLECTION_NAME).updateOne(
      { userId: new ObjectId(String(userId)), status: 'active' },
      {
        $set: {
          items: [],
          totalPrice: 0,
          discountAmount: 0,
          finalPrice: 0,
          couponId: null,
          updatedAt: Date.now()
        }
      }
    )
  } catch (error) { throw error }
}

export const cartModel = {
  CART_COLLECTION_NAME,
  CART_COLLECTION_SCHEMA,
  createNew,
  findOneByUserId,
  findOneById,
  update,
  pushProductToCart,
  getCartDetail,
  clearCart
}
