import { StatusCodes } from 'http-status-codes'
import { articleModel } from '~/models/articleModel'
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
        'image-article-rebuy-market'
      )
      newData.image = uploadResult.secure_url
    }

    const createdArticle = await articleModel.createNew(newData)
    const getNewArticle = await articleModel.findOneById(createdArticle.insertedId)
    return getNewArticle
  } catch (error) { throw error }
}

const getArticles = async () => {
  try {
    const results = await articleModel.getArticles()
    return results
  } catch (error) { throw error }
}

const update = async (articleId, reqBody, reqFile) => {
  try {
    const newData = {
      ...reqBody
    }

    if (reqFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(
        reqFile.buffer,
        'image-article-rebuy-market'
      )
      newData.image = uploadResult.secure_url
    }
    if (reqBody.name) {
      newData.slug = slugify(reqBody.name)
    }

    const updatedArticle = await articleModel.update(articleId, newData)
    return updatedArticle
  } catch (error) {
    throw error
  }
}

const deleteItem = async (articleId) => {
  try {
    const article = await articleModel.findOneById(articleId)
    if (!article) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bài viết!')
    await articleModel.deleteByOneId(articleId)
    return { deleteResult: 'Xóa bài viết thành công!' }
  } catch (error) { throw error }
}

const getDetails = async (articleId) => {
  const article = await articleModel.findOneById(articleId)
  if (!article) throw new ApiError(StatusCodes.NOT_FOUND, 'không tìm thấy bài viết')
  return article
}

export const articleService = {
  createNew,
  getArticles,
  update,
  deleteItem,
  getDetails
}
