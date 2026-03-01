import { couponModel } from '~/models/couponModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const createCoupon = async (reqBody) => {
  const existingCoupon = await couponModel.findByCode(reqBody.code)
  if (existingCoupon) {
    throw new ApiError(StatusCodes.CONFLICT, 'Mã giảm giá này đã tồn tại!')
  }

  const createdCoupon = await couponModel.createNew(reqBody)
  const getNewCoupon = await couponModel.findOneById(createdCoupon.insertedId)
  return getNewCoupon
}

const applyCoupon = async ({ code, totalOrderValue }) => {
  const coupon = await couponModel.findByCode(code)

  if (!coupon) throw new ApiError(StatusCodes.NOT_FOUND, 'Mã giảm giá không tồn tại!')

  const now = Date.now()
  const start = new Date(coupon.startDate).getTime()
  const end = new Date(coupon.endDate).getTime()

  if (!coupon.isActive) throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã giảm giá đã bị khóa!')
  if (now < start) throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã giảm giá chưa đến đợt áp dụng!')
  if (now > end) throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã giảm giá đã hết hạn!')

  if (coupon.quantity <= 0) throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã giảm giá đã hết lượt sử dụng!')

  if (totalOrderValue < coupon.discount.minOrder) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Đơn hàng phải từ ${coupon.discount.minOrder.toLocaleString('vi-VN')}đ mới được dùng mã này!`
    )
  }

  let discountAmount = 0

  if (coupon.discount.type === 'FIXED') {
    discountAmount = coupon.discount.value
  } else {
    discountAmount = (totalOrderValue * coupon.discount.value) / 100

    if (coupon.discount.maxAmount && discountAmount > coupon.discount.maxAmount) {
      discountAmount = coupon.discount.maxAmount
    }
  }

  if (discountAmount > totalOrderValue) {
    discountAmount = totalOrderValue
  }

  return {
    couponId: coupon._id,
    code: coupon.code,
    discountAmount: discountAmount,
    message: `Áp dụng mã thành công! Bạn được giảm ${discountAmount.toLocaleString('vi-VN')}đ`
  }
}

const getAllCoupons = async () => {
  return await couponModel.getCoupons({})
}

const getValidCoupons = async () => {
  const now = new Date()

  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    quantity: { $gt: 0 }
  }

  return await couponModel.getCoupons(query)
}

const updateCoupon = async (couponId, reqBody) => {
  if (reqBody.code) {
    const existingCoupon = await couponModel.findByCode(reqBody.code)
    if (existingCoupon && existingCoupon._id.toString() !== couponId) {
      throw new ApiError(StatusCodes.CONFLICT, 'Mã code này đã được sử dụng bởi khuyến mãi khác!')
    }
  }

  const updatedCoupon = await couponModel.update(couponId, reqBody)

  if (!updatedCoupon) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mã giảm giá!')
  }

  return updatedCoupon
}

const deleteCoupon = async (couponId) => {
  const targetCoupon = await couponModel.findOneById(couponId)

  if (!targetCoupon) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mã giảm giá không tồn tại!')
  }

  if (targetCoupon.usedCount > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Không thể xóa mã này vì đã có người sử dụng! Hãy cập nhật trạng thái sang "expired" để ẩn nó đi.'
    )
  }

  await couponModel.deleteOne(couponId)

  return { message: 'Xóa mã giảm giá thành công!' }
}

export const couponService = {
  createCoupon,
  applyCoupon,
  getAllCoupons,
  getValidCoupons,
  updateCoupon,
  deleteCoupon
}
