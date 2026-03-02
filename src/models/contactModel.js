import { GET_DB } from '~/config/mongodb'
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE } from '~/utils/validator'
import { STATUS_CONTACT } from '~/utils/constants'

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']
const CONTACT_COLLECTION_NAME = 'contacts'
const CONTACT_COLLECTION_SCHEMA = Joi.object({
  fullname: Joi.string().required().min(3).max(100).trim().strict(),
  email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE).trim().strict(),
  phone: Joi.string().required().pattern(PHONE_RULE).message(PHONE_RULE_MESSAGE).trim().strict(),
  message: Joi.string().required().min(10).max(1000).trim().strict(),
  status: Joi.string().valid(...Object.values(STATUS_CONTACT)).default(STATUS_CONTACT.NEW),
  adminNotes: Joi.string().trim().optional().allow(null, '').default(''),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await CONTACT_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false, allowUnknown: true })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newContact = {
      ...validData
    }

    return await GET_DB().collection(CONTACT_COLLECTION_NAME).insertOne(newContact)
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(CONTACT_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
  } catch (error) { throw new Error(error) }
}

const getContacts = async () => {
  try {
    const result = await GET_DB().collection(CONTACT_COLLECTION_NAME).aggregate([
      { $match: { _destroy: false } },
      { $sort: { createdAt: -1 } }
    ]).toArray()

    return result
  } catch (error) { throw new Error(error) }
}

const update = async (contactId, updateData) => {
  try {
    Object.keys(updateData).forEach(fielName => {
      if (INVALID_UPDATE_FIELDS.includes(fielName)) {
        delete updateData[fielName]
      }
    })

    updateData.updatedAt = Date.now()

    const result = await GET_DB().collection(CONTACT_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(contactId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

const deleteByOneId = async (contactId) => {
  try {
    const result = await GET_DB().collection(CONTACT_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(String(contactId)) },
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


export const contactModel = {
  CONTACT_COLLECTION_NAME,
  CONTACT_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getContacts,
  update,
  deleteByOneId
}
