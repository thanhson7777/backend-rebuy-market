import { StatusCodes } from 'http-status-codes'
import { articleService } from '~/services/articleService'

const createNew = async (req, res, next) => {
  try {
    const createdArticle = await articleService.createNew(req.body, req.file)
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Tạo mới bài viết thành công',
      data: createdArticle
    })
  } catch (error) { next(error) }
}

const getArticles = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 4
    const result = await articleService.getArticles(limit)
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Lấy danh sách bài viết thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const articleId = req.params.id
    const updatedArticle = await articleService.update(articleId, req.body, req.file)
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Cập nhật bài viết thành công',
      data: updatedArticle
    })
  } catch (error) {
    next(error)
  }
}

const deleteItem = async (req, res, next) => {
  try {
    const articleId = req.params.id
    const article = await articleService.deleteItem(articleId)

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: article.deleteResult
    })
  } catch (error) { next(error) }
}

const getDetails = async (req, res, next) => {
  try {
    const articleId = req.params.id
    const article = await articleService.getDetails(articleId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy chi tiết bài viết thành công!',
      data: article
    })
  } catch (error) { next(error) }
}

export const articleController = {
  createNew,
  getArticles,
  update,
  deleteItem,
  getDetails
}
