import { GET_DB } from '~/config/mongodb'
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { productModel } from './productModel'

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']
const CATEGORY_COLLECTION_NAME = 'categories'
const CATEGORY_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().min(3).max(100).trim().strict(),
  slug: Joi.string().required().trim().strict(),
  image: Joi.string().trim().optional().allow(null, ''),
  description: Joi.string().optional(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await CATEGORY_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false, allowUnknown: true })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newCategory = {
      ...validData
    }

    return await GET_DB().collection(CATEGORY_COLLECTION_NAME).insertOne(newCategory)
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(CATEGORY_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
  } catch (error) { throw new Error(error) }
}

const getDetails = async (categoryId) => {
  try {
    const queryCondition = [
      { _id: new ObjectId(String(categoryId)) },
      { _destroy: false }
    ]

    const result = await GET_DB().collection(CATEGORY_COLLECTION_NAME).aggregate([
      { $match: { $and: queryCondition } },
      {
        $lookup: {
          from: productModel.PRODUCT_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products'
        }
      }
    ]).toArray()

    return result[0] || null
  } catch (error) { throw new Error(error) }
}

const getCategories = async () => {
  try {
    const result = await GET_DB().collection(CATEGORY_COLLECTION_NAME).aggregate([
      { $match: { _destroy: false } },
      { $sort: { createdAt: -1 } }
    ]).toArray()

    return result
  } catch (error) { throw new Error(error) }
}

const update = async (categoryId, updateData) => {
  try {
    Object.keys(updateData).forEach(fielName => {
      if (INVALID_UPDATE_FIELDS.includes(fielName)) {
        delete updateData[fielName]
      }
    })

    updateData.updatedAt = Date.now()

    const result = await GET_DB().collection(CATEGORY_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(categoryId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

const deleteByOneId = async (categoryId) => {
  try {
    const result = await GET_DB().collection(CATEGORY_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(String(categoryId)) },
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


export const categoryModel = {
  CATEGORY_COLLECTION_NAME,
  CATEGORY_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getCategories,
  update,
  deleteByOneId,
  getDetails
}
