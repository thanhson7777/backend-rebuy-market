import { cartModel } from '~/models/cartModel'
import { productModel } from '~/models/ProductModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const getCart = async (userId) => {
  const cart = await cartModel.getCartDetail(userId)
  if (!cart) return null

  if (cart.items && cart.items.length > 0) {
    cart.totalPrice = cart.items.reduce((total, item) => {
      return total + item.price
    }, 0)
  } else {
    cart.totalPrice = 0
  }

  cart.finalPrice = cart.totalPrice - (cart.discountAmount || 0)
  if (cart.finalPrice < 0) cart.finalPrice = 0

  return cart
}

const addToCart = async ({ userId, productId }) => {
  const product = await productModel.findOneById(productId)
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại!')
  }
  let cart = await cartModel.findOneByUserId(userId)

  if (!cart) {
    const newCartData = {
      userId: userId.toString(),
      items: [{ productId: productId.toString(), quantity: 1 }],
      totalPrice: 0,
      couponId: null,
      discountAmount: 0,
      finalPrice: 0,
      status: 'active'
    }

    await cartModel.createNew(newCartData)
    return await getCart(userId)
  }

  const existingProductIndex = cart.items.findIndex(item => item.productId.toString() === productId)

  if (existingProductIndex > -1) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Sản phẩm đã có trong giỏ hàng!')
  } else {
    cart.items.push({
      productId: product._id.toString(),
      quantity: 1
    })
  }

  await cartModel.update(cart._id, {
    items: cart.items,
    updatedAt: Date.now()
  })

  return await getCart(userId)
}

const updateCart = async ({ userId, productId }) => {
  const cart = await cartModel.findOneByUserId(userId)
  if (!cart) throw new ApiError(StatusCodes.NOT_FOUND, 'Giỏ hàng không tồn tại!')

  const product = await productModel.findOneById(productId)
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại!')
  const productIndex = cart.items.findIndex(p => p.productId.toString() === productId)

  if (productIndex === -1) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Sản phẩm không có trong giỏ hàng!')
  }

  // eslint-disable-next-line no-unused-vars
  await cartModel.update(cart._id, {
    items: cart.items,
    couponId: null,
    discountAmount: 0,
    updatedAt: Date.now()
  })

  return await getCart(userId)
}

const deleteItem = async ({ userId, productId }) => {
  const cart = await cartModel.findOneByUserId(userId)
  if (!cart) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Giỏ hàng không tồn tại!')
  }

  const productExists = cart.items.some(p => p.productId.toString() === productId)
  if (!productExists) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Sản phẩm không có trong giỏ hàng để xóa!')
  }

  const newProducts = cart.items.filter(item => item.productId.toString() !== productId)

  await cartModel.update(cart._id, {
    items: newProducts,
    couponId: null,
    discountAmount: 0,
    updatedAt: Date.now()
  })

  return await getCart(userId)
}

export const cartService = {
  addToCart,
  getCart,
  updateCart,
  deleteItem
}