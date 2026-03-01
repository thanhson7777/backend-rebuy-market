import { StatusCodes } from 'http-status-codes'
import { couponService } from '~/services/couponService'

const createCoupon = async (req, res, next) => {
  try {
    const newCoupon = await couponService.createCoupon(req.body)
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Tạo mã giảm giá thành công!',
      data: newCoupon
    })
  } catch (error) { next(error) }
}

const applyCoupon = async (req, res, next) => {
  try {
    const { code, totalOrderValue } = req.body

    const result = await couponService.applyCoupon({ code, totalOrderValue })

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      data: result
    })
    // console.log('data', result)
  } catch (error) { next(error) }
}

const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await couponService.getAllCoupons()
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy danh sách mã giảm giá thành công!',
      data: coupons
    })
  } catch (error) { next(error) }
}

const getValidCoupons = async (req, res, next) => {
  try {
    const coupons = await couponService.getValidCoupons()
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy danh sách mã giảm giá còn dùng được thành công!',
      data: coupons
    })
  } catch (error) { next(error) }
}

const updateCoupon = async (req, res, next) => {
  try {
    const { couponId } = req.params
    const updatedCoupon = await couponService.updateCoupon(couponId, req.body)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công!',
      data: updatedCoupon
    })
  } catch (error) { next(error) }
}

const deleteCoupon = async (req, res, next) => {
  try {
    const { couponId } = req.params

    const result = await couponService.deleteCoupon(couponId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      data: result
    })
  } catch (error) { next(error) }
}

export const couponController = {
  createCoupon,
  applyCoupon,
  getAllCoupons,
  getValidCoupons,
  updateCoupon,
  deleteCoupon
}
