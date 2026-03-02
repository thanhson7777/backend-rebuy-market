import { StatusCodes } from 'http-status-codes'
import { bannerService } from '~/services/bannerService'

const createNew = async (req, res, next) => {
  try {
    const createdCategory = await bannerService.createNew(req.body, req.files)
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Tạo mới danh mục thành công',
      data: createdCategory
    })
  } catch (error) { next(error) }
}

const getBanners = async (req, res, next) => {
  try {
    const result = await bannerService.getBanners()
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Lấy danh sách banner thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}


const update = async (req, res, next) => {
  try {
    const bannerId = req.params.id
    const updatedBanner = await bannerService.update(bannerId, req.body, req.files)
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Cập nhật banner thành công',
      data: updatedBanner
    })
  } catch (error) {
    next(error)
  }
}

const deleteItem = async (req, res, next) => {
  try {
    const bannerId = req.params.id
    const banner = await bannerService.deleteItem(bannerId)

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: banner.deleteResult
    })
  } catch (error) { next(error) }
}

export const bannerController = {
  createNew,
  getBanners,
  update,
  deleteItem
}
