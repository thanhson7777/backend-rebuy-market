import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import ApiError from '~/utils/ApiError'
import { bannerModel } from '~/models/bannerModel'
import { StatusCodes } from 'http-status-codes'
import { slugify } from '~/utils/formatter'

const createNew = async (reqBody, reqFiles) => {
  try {
    const newData = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    if (!newData.image) {
      newData.image = []
    } else if (!Array.isArray(newData.image)) {
      newData.image = [newData.image]
    }

    if (reqFiles && reqFiles.length > 0) {
      const uploadPromises = reqFiles.map(file =>
        CloudinaryProvider.streamUpload(file.buffer, 'image-banner-rebuy-market')
      )
      const uploadResults = await Promise.all(uploadPromises)
      const uploadedUrls = uploadResults.map(result => result.secure_url)
      newData.image = [...newData.image, ...uploadedUrls]
    }

    const createdBanner = await bannerModel.createNew(newData)
    const getNewBanner = await bannerModel.findOneById(createdBanner.insertedId)
    return getNewBanner
  } catch (error) { throw error }
}

const getBanners = async () => {
  try {
    const results = await bannerModel.getBanners()
    return results
  } catch (error) { throw error }
}

const update = async (bannerId, reqBody, reqFiles) => {
  try {
    const newData = {
      ...reqBody
    }

    if (newData.image !== undefined) {
      if (newData.image === null || newData.image === '') {
        newData.image = []
      } else if (!Array.isArray(newData.image)) {
        newData.image = [newData.image]
      }
    }

    if (reqFiles && reqFiles.length > 0) {
      const uploadPromises = reqFiles.map(file =>
        CloudinaryProvider.streamUpload(file.buffer, 'image-banner-rebuy-market')
      )
      const uploadResults = await Promise.all(uploadPromises)
      const uploadedUrls = uploadResults.map(result => result.secure_url)
      newData.image = newData.image ? [...newData.image, ...uploadedUrls] : [...uploadedUrls]
    }
    if (reqBody.title) {
      newData.slug = slugify(reqBody.title)
    }

    const updatedBanner = await bannerModel.update(bannerId, newData)
    return updatedBanner
  } catch (error) {
    throw error
  }
}

const deleteItem = async (bannerId) => {
  try {
    const banner = await bannerModel.findOneById(bannerId)
    if (!banner) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy banner!')
    await bannerModel.deleteByOneId(bannerId)
    return { deleteResult: 'Xóa banner thành công!' }
  } catch (error) { throw error }
}

export const bannerService = {
  createNew,
  getBanners,
  update,
  deleteItem
}
