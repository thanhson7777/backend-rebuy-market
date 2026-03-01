import { StatusCodes } from 'http-status-codes'
import { cartService } from '~/services/cartService'

const addToCart = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { productId } = req.body

    const cart = await cartService.addToCart({ userId, productId })

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Thêm sản phẩm vào giỏ hàng thành công!',
      data: cart
    })
  } catch (error) { next(error) }
}

const getCart = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const cart = await cartService.getCart(userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy thông tin giỏ hàng thành công!',
      data: cart
    })
  } catch (error) { next(error) }
}

const updateCart = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { productId } = req.body

    const cart = await cartService.updateCart({ userId, productId })

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập nhật giỏ hàng thành công!',
      data: cart
    })
  } catch (error) { next(error) }
}

const deleteItem = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { productId } = req.body

    const updatedCart = await cartService.deleteItem({ userId, productId })

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Xóa sản phẩm khỏi giỏ hàng thành công!',
      data: updatedCart
    })
  } catch (error) { next(error) }
}

export const cartController = {
  addToCart,
  getCart,
  updateCart,
  deleteItem
}