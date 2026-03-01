import { StatusCodes } from 'http-status-codes'
import { categoryService } from '~/services/categoryService'

const createNew = async (req, res, next) => {
  try {
    const createdCategory = await categoryService.createNew(req.body, req.file)
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Tạo mới danh mục thành công',
      data: createdCategory
    })
  } catch (error) { next(error) }
}

const getCategories = async (req, res, next) => {
  try {
    const result = await categoryService.getCategories()
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Lấy danh sách danh mục thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const result = await categoryService.getDetails(req.params.id)
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Lấy chi tiết danh mục thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const categoryId = req.params.id
    const updateCategory = await categoryService.update(categoryId, req.body, req.file)
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Cập nhật danh mục thành công',
      data: updateCategory
    })
  } catch (error) {
    next(error)
  }
}

const deleteItem = async (req, res, next) => {
  try {
    const categoryId = req.params.id
    const category = await categoryService.deleteItem(categoryId)

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: category.deleteResult
    })
  } catch (error) { next(error) }
}

export const categoryController = {
  createNew,
  getCategories,
  getDetails,
  update,
  deleteItem
}
