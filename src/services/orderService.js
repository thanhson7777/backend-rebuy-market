import { orderModel } from '~/models/orderModel'
import { cartModel } from '~/models/cartModel'
import { productModel } from '~/models/ProductModel'
import { couponModel } from '~/models/couponModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { STATUS_ORDER, STATUS_PAYMENT } from '~/utils/constants'
import { vnpayInstance } from '~/config/vnpayConfig'
import { ProductCode, VnpLocale, dateFormat } from 'vnpay'
import crypto from 'crypto'
import { DEFAULT_PAGE, DEFAULT_ITEM_PER_PAGE } from '~/utils/constants'
import { ghnProvider } from '~/providers/GHNProvider'

const createNew = async ({ userId, reqBody }) => {
  const cart = await cartModel.findOneByUserId(userId)
  if (!cart || cart.items.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Giỏ hàng trống!')
  }

  let finalProductList = []
  let totalProductPrice = 0

  for (const item of cart.items) {
    const product = await productModel.findOneById(item.productId)
    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, `Sản phẩm ID ${item.productId} không tồn tại!`)
    }

    let realPrice = product.price
    let finalName = product.name
    let finalImage = product.image
    let finalQuantity = 1

    if (!realPrice && realPrice !== 0) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Lỗi dữ liệu: Sản phẩm ${finalName} chưa được thiết lập giá!`)
    }

    const itemTotalPrice = realPrice * finalQuantity
    totalProductPrice += itemTotalPrice

    finalProductList.push({
      productId: product._id.toString(),
      name: finalName,
      price: realPrice,
      quantity: finalQuantity,
      totalPrice: itemTotalPrice,
      weight: product.weight || 1000,
      length: product.length || 15,
      width: product.width || 15,
      height: product.height || 15,
      image: finalImage
    })
  }

  let discountAmount = 0
  let couponId = null
  if (reqBody.couponCode) {
    const coupon = await couponModel.findByCode(reqBody.couponCode)
    const now = Date.now()
    if (coupon && coupon.isActive &&
      now >= coupon.startDate && now <= coupon.endDate &&
      coupon.quantity > 0 &&
      totalProductPrice >= coupon.discount.minOrder
    ) {
      couponId = coupon._id
      if (coupon.discount.type === 'FIXED') {
        discountAmount = coupon.discount.value
      } else {
        discountAmount = (totalProductPrice * coupon.discount.value) / 100
        if (coupon.discount.maxAmount && discountAmount > coupon.discount.maxAmount) {
          discountAmount = coupon.discount.maxAmount
        }
      }
    }
  }

  let totalWeight = 0
  let totalLength = 0
  let totalWidth = 0
  let totalHeight = 0

  finalProductList.forEach(item => {
    totalWeight += item.weight
    totalLength += item.length
    totalWidth += item.width
    totalHeight += item.height
  })

  const actualShippingFee = await ghnProvider.calculateShippingFee({
    to_district_id: reqBody.shippingAddress.district_id,
    to_ward_code: reqBody.shippingAddress.ward_code,
    weight: totalWeight,
    length: totalLength,
    width: totalWidth,
    height: totalHeight,
    insurance_value: totalProductPrice
  })

  if (actualShippingFee !== reqBody.shippingFee) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Phí vận chuyển không khớp so với dữ liệu tính toán từ Giao Hàng Nhanh. Vui lòng tải lại trang!')
  }

  const finalPrice = totalProductPrice + actualShippingFee - discountAmount

  const newOrderData = {
    userId: userId.toString(),
    shippingAddress: reqBody.shippingAddress,
    payment: {
      method: reqBody.paymentMethod,
      status: STATUS_PAYMENT.PENDING
    },
    items: finalProductList,
    totalProductPrice,
    shippingFee: actualShippingFee,
    couponId: couponId ? couponId.toString() : null,
    couponCode: reqBody.couponCode || null,
    discountAmount,
    finalPrice: finalPrice > 0 ? finalPrice : 0,
    status: STATUS_ORDER.PENDING
  }

  const newOrder = await orderModel.createNew(newOrderData)

  // Wait for product updates. Using typical "update" or create specific function
  await Promise.all(finalProductList.map(item => {
    return productModel.update(item.productId, { status: 'sold' })
  }))

  if (couponId) await couponModel.updateUsage(couponId)
  await cartModel.clearCart(userId)
  const getNewOrder = await orderModel.findOneById(newOrder.insertedId)

  let paymentUrl = null

  if (reqBody.paymentMethod === 'VNPAY') {
    const transactionId = `${newOrder.insertedId.toString()}_${Date.now()}`

    const now = new Date()
    const expireDate = new Date(now.getTime() + 15 * 60000)

    paymentUrl = vnpayInstance.buildPaymentUrl({
      vnp_Amount: Number(newOrderData.finalPrice),
      vnp_IpAddr: '127.0.0.1',
      vnp_TxnRef: transactionId,
      vnp_OrderInfo: `Thanh toan don hang ${newOrder.insertedId.toString()}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(now),
      vnp_ExpireDate: dateFormat(expireDate)
    })
  } else if (reqBody.paymentMethod === 'MOMO') {
    const partnerCode = process.env.MOMO_PARTNER_CODE
    const accessKey = process.env.MOMO_ACCESS_KEY
    const secretKey = process.env.MOMO_SECRET_KEY

    const orderId = `${newOrder.insertedId.toString()}_${Date.now()}`
    const requestId = orderId
    const amount = newOrderData.finalPrice
    const orderInfo = `Thanh toan don hang ${newOrder.insertedId.toString()}`
    const redirectUrl = 'http://localhost:8017/v1/payments/momo_callback'
    const ipnUrl = 'http://localhost:8017/v1/payments/momo_callback'
    const requestType = 'payWithMethod'
    const extraData = ''

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex')

    const requestBody = {
      partnerCode,
      partnerName: 'My Store',
      storeId: 'StoreTest',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      signature
    }

    const response = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    if (data.resultCode === 0) {
      paymentUrl = data.payUrl
    } else {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Lỗi tạo đơn MoMo: ${data.message}`)
    }
  }

  return { order: getNewOrder, paymentUrl }
}

const getAdminOrders = async ({ page, limit, status }) => {
  const currentPage = parseInt(page, 10) || DEFAULT_PAGE
  const recordLimit = parseInt(limit, 10) || DEFAULT_ITEM_PER_PAGE

  const result = await orderModel.getAdminOrders({
    page: currentPage,
    limit: recordLimit,
    status: status || null
  })

  return result
}

const updateOrderStatus = async (orderId, status) => {
  const validStatuses = [...Object.values(STATUS_ORDER)]

  if (!validStatuses.includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Trạng thái không hợp lệ! Chỉ chấp nhận: ${validStatuses.join(', ')}`)
  }

  const updateData = {
    status: status
  }

  const updatedOrder = await orderModel.updateOrderStatus(orderId, updateData)

  if (!updatedOrder) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng này!')
  }

  return updatedOrder
}

const cancelOrder = async (orderId, userId) => {
  const order = await orderModel.findOneById(orderId)
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Đơn hàng không tồn tại!')
  }

  if (order.userId.toString() !== userId.toString()) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền huỷ đơn hàng này!')
  }

  if (order.status !== 'PENDING') {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Không thể huỷ đơn hàng đang ở trạng thái: ${order.status}`)
  }

  const updatedOrder = await orderModel.update(orderId, {
    status: 'CANCELLED'
  })

  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      await productModel.update(item.productId, { status: 'active' })
    }
  }

  return updatedOrder
}

const getMyOrders = async (userId) => {
  const orders = await orderModel.getUserOrders(userId)
  return orders
}

const previewShippingFee = async (userId, districtId, wardCode) => {
  const cart = await cartModel.findOneByUserId(userId)
  if (!cart || cart.items.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Giỏ hàng trống!')
  }

  let totalWeight = 0
  let totalLength = 0
  let totalWidth = 0
  let totalHeight = 0
  let totalProductPrice = 0

  for (const item of cart.items) {
    const product = await productModel.findOneById(item.productId)
    if (product) {
      totalWeight += product.weight || 1000
      totalLength += product.length || 15
      totalWidth += product.width || 15
      totalHeight += product.height || 15
      totalProductPrice += product.price
    }
  }

  const fee = await ghnProvider.calculateShippingFee({
    to_district_id: districtId,
    to_ward_code: wardCode,
    weight: totalWeight,
    length: totalLength,
    width: totalWidth,
    height: totalHeight,
    insurance_value: totalProductPrice
  })

  return { shippingFee: fee }
}

export const orderService = {
  createNew,
  getAdminOrders,
  updateOrderStatus,
  cancelOrder,
  getMyOrders,
  previewShippingFee
}