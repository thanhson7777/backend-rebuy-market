import { GET_DB } from '~/config/mongodb'
import Joi from 'joi'
import { ObjectId } from 'mongodb'

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']
const BANNER_COLLECTION_NAME = 'banners'
const BANNER_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(100).trim().strict(),
  slug: Joi.string().required().trim().strict(),
  image: Joi.array().items(Joi.string().trim()).default([]),
  isActive: Joi.boolean().default(true),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await BANNER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false, allowUnknown: true })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newBanner = {
      ...validData
    }

    return await GET_DB().collection(BANNER_COLLECTION_NAME).insertOne(newBanner)
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(BANNER_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
  } catch (error) { throw new Error(error) }
}

const getBanners = async () => {
  try {
    const result = await GET_DB().collection(BANNER_COLLECTION_NAME).aggregate([
      { $match: { _destroy: false } },
      { $sort: { createdAt: -1 } }
    ]).toArray()

    return result
  } catch (error) { throw new Error(error) }
}

const update = async (bannerId, updateData) => {
  try {
    Object.keys(updateData).forEach(fielName => {
      if (INVALID_UPDATE_FIELDS.includes(fielName)) {
        delete updateData[fielName]
      }
    })

    updateData.updatedAt = Date.now()

    const result = await GET_DB().collection(BANNER_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(bannerId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

const deleteByOneId = async (bannerId) => {
  try {
    const result = await GET_DB().collection(BANNER_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(String(bannerId)) },
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

export const bannerModel = {
  BANNER_COLLECTION_NAME,
  BANNER_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getBanners,
  update,
  deleteByOneId
}
