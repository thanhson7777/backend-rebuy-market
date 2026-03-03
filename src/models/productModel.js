import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { pagingSkipValue } from '~/utils/algorithm'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validator'
import { STATUS_PRODUCT } from '~/utils/constants'

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const PRODUCT_COLLECTION_NAME = 'products'
const PRODUCT_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().min(3).max(100).trim().strict(),
  categoryId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  slug: Joi.string().required().min(3).trim().strict(),
  sku: Joi.string().trim().default(null),
  price: Joi.number().min(0).required(),

  weight: Joi.number().min(1).required(), // Đơn vị: gram
  length: Joi.number().min(1).required(), // Đơn vị: cm
  width: Joi.number().min(1).required(), // Đơn vị: cm
  height: Joi.number().min(1).required(), // Đơn vị: cm

  defects: Joi.string().trim().default(null),
  description: Joi.string().trim().default(null),
  image: Joi.array().items(Joi.string().trim()).default([]),

  status: Joi.string().valid(...Object.values(STATUS_PRODUCT)).default(STATUS_PRODUCT.AVAILABLE),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await PRODUCT_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false, allowUnknown: true })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)

    const newProduct = {
      ...validData,
      categoryId: new ObjectId(String(validData.categoryId))
    }
    return await GET_DB().collection(PRODUCT_COLLECTION_NAME).insertOne(newProduct)
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(PRODUCT_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
  } catch (error) { throw new Error(error) }
}

const getProducts = async (page, itemsPerPage) => {
  try {
    const query = await GET_DB().collection(PRODUCT_COLLECTION_NAME).aggregate(
      [
        {
          $match: {
            _destroy: false,
            status: STATUS_PRODUCT.AVAILABLE
          }
        },
        {
          $facet: {
            'queryProducts': [
              { $sort: { createdAt: -1 } },
              { $skip: pagingSkipValue(page, itemsPerPage) },
              { $limit: itemsPerPage }
            ],
            'queryTotalProducts': [
              { $count: 'countedAllProducts' }
            ]
          }
        }
      ]
    ).toArray()

    const res = query[0]

    return {
      products: res.queryProducts || [],
      totalProducts: res.queryTotalProducts[0]?.countedAllProducts || 0
    }
  } catch (error) { throw new Error(error) }
}

const update = async (productId, updateData) => {
  try {
    Object.keys(updateData).forEach(fielName => {
      if (INVALID_UPDATE_FIELDS.includes(fielName)) {
        delete updateData[fielName]
      }
    })

    if (updateData.categoryId) {
      updateData.categoryId = new ObjectId(String(updateData.categoryId))
    }

    updateData.updatedAt = Date.now()

    const result = await GET_DB().collection(PRODUCT_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(productId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

const deleteByOneId = async (productId) => {
  try {
    const result = await GET_DB().collection(PRODUCT_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(productId)) },
      {
        $set: {
          _destroy: true,
          updatedAt: Date.now()
        }
      },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteManyByCategoryId = async (categoryId) => {
  try {
    const result = await GET_DB().collection(PRODUCT_COLLECTION_NAME).updateMany(
      { categoryId: new ObjectId(String(categoryId)) },
      {
        $set: {
          _destroy: true,
          updatedAt: Date.now()
        }
      }
    )
    return result
  } catch (error) { throw error }
}

const getAdminProducts = async () => {
  try {
    return await GET_DB().collection(PRODUCT_COLLECTION_NAME)
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
  } catch (error) { throw new Error(error) }
}

const restoreProduct = async (productId) => {
  try {
    const result = await GET_DB().collection(PRODUCT_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(productId)) },
      {
        $set: {
          _destroy: false,
          updatedAt: Date.now()
        }
      },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

const forceDeleteProduct = async (productId) => {
  try {
    const result = await GET_DB().collection(PRODUCT_COLLECTION_NAME).deleteOne({
      _id: new ObjectId(String(productId))
    })
    return result
  } catch (error) { throw new Error(error) }
}

export const productModel = {
  PRODUCT_COLLECTION_NAME,
  PRODUCT_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getProducts,
  update,
  deleteByOneId,
  deleteManyByCategoryId,
  getAdminProducts,
  restoreProduct,
  forceDeleteProduct
}
