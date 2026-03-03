import { StatusCodes } from 'http-status-codes'
import { orderService } from '~/services/orderService'

const createNew = async (req, res, next) => {
  try {
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'

    const result = await orderService.createNew({
      userId: req.jwtDecoded._id,
      reqBody: req.body,
      ipAddr
    })

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Tạo đơn hàng mới thành công!',
      data: result
    })
    // console.log('result', result)
  } catch (error) { next(error) }
}

const getAdminOrders = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query

    const result = await orderService.getAdminOrders({ page, limit, status })

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id
    const { status } = req.body

    const updatedOrder = await orderService.updateOrderStatus(orderId, status)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công!',
      data: updatedOrder
    })
  } catch (error) {
    next(error)
  }
}

const cancelOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id
    const userId = req.jwtDecoded._id
    const result = await orderService.cancelOrder(orderId, userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Hủy đơn hàng thành công!',
      order: result
    })
  } catch (error) {
    next(error)
  }
}

const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const result = await orderService.getMyOrders(userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy danh sách đơn hàng của người dùng thành công!',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const previewShippingFee = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { province, district } = req.body

    const result = await orderService.previewShippingFee(userId, province, district)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Tính phí vận chuyển thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const orderController = {
  createNew,
  getAdminOrders,
  updateOrderStatus,
  cancelOrder,
  getMyOrders,
  previewShippingFee
}