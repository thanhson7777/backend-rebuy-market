import { GET_DB } from '~/config/mongodb'
import Joi from 'joi'
import { ObjectId } from 'mongodb'

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']
const ARTiCLE_COLLECTION_NAME = 'articles'
const ARTiCLE_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().min(3).max(100).trim().strict(),
  slug: Joi.string().required().trim().strict(),
  thumbnail_url: Joi.string().trim().optional().allow(null, ''),
  summary: Joi.string().trim().max(300).required(),
  content: Joi.string().trim().required(),
  status: Joi.string().valid('draft', 'published', 'hidden').default('draft'),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await ARTiCLE_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false, allowUnknown: true })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newCategory = {
      ...validData
    }

    return await GET_DB().collection(ARTiCLE_COLLECTION_NAME).insertOne(newCategory)
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(ARTiCLE_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
  } catch (error) { throw new Error(error) }
}

const getArticles = async () => {
  try {
    const result = await GET_DB().collection(ARTiCLE_COLLECTION_NAME).aggregate([
      { $match: { _destroy: false } },
      { $sort: { createdAt: -1 } }
    ]).toArray()

    return result
  } catch (error) { throw new Error(error) }
}

const update = async (articleId, updateData) => {
  try {
    Object.keys(updateData).forEach(fielName => {
      if (INVALID_UPDATE_FIELDS.includes(fielName)) {
        delete updateData[fielName]
      }
    })

    updateData.updatedAt = Date.now()

    const result = await GET_DB().collection(ARTiCLE_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(articleId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

const deleteByOneId = async (articleId) => {
  try {
    const result = await GET_DB().collection(ARTiCLE_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(String(articleId)) },
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


export const articleModel = {
  ARTiCLE_COLLECTION_NAME,
  ARTiCLE_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getArticles,
  update,
  deleteByOneId
}
