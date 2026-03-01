import { StatusCodes } from 'http-status-codes'
import { categoryModel } from '~/models/categoryModel'
import { productModel } from '~/models/ProductModel'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import ApiError from '~/utils/ApiError'
import { slugify } from '~/utils/formatter'

const createNew = async (reqBody, reqFile) => {
  try {
    const newData = {
      ...reqBody,
      slug: slugify(reqBody.name)
    }

    if (reqFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(
        reqFile.buffer,
        'image-product-rebuy-market'
      )
      newData.image = uploadResult.secure_url
    }

    const createdCategory = await categoryModel.createNew(newData)
    const getNewCategory = await categoryModel.findOneById(createdCategory.insertedId)
    return getNewCategory
  } catch (error) { throw error }
}

const getCategories = async () => {
  try {
    const results = await categoryModel.getCategories()
    return results
  } catch (error) { throw error }
}

const getDetails = async (categoryId) => {
  try {
    const result = await categoryModel.getDetails(categoryId)
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy danh mục')
    return result
  } catch (error) { throw error }
}

const update = async (categoryId, reqBody, reqFile) => {
  try {
    const newData = {
      ...reqBody
    }

    if (reqFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(
        reqFile.buffer,
        'image-product-rebuy-market'
      )
      newData.image = uploadResult.secure_url
    }
    if (reqBody.name) {
      newData.slug = slugify(reqBody.name)
    }

    const updatedCategory = await categoryModel.update(categoryId, newData)
    return updatedCategory
  } catch (error) {
    throw error
  }
}

const deleteItem = async (categoryId) => {
  try {
    const category = await categoryModel.findOneById(categoryId)
    if (!category) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy danh mục!')
    await productModel.deleteManyByCategoryId(categoryId)
    await categoryModel.deleteByOneId(categoryId)
    return { deleteResult: 'Xóa danh mục và các sản phẩm liên quan thành công!' }
  } catch (error) { throw error }
}

export const categoryService = {
  createNew,
  getCategories,
  getDetails,
  update,
  deleteItem
}
