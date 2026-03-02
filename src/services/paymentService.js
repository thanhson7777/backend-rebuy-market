import { vnpayInstance } from '~/config/vnpayConfig'
import { orderModel } from '~/models/orderModel'
import { STATUS_ORDER, STATUS_PAYMENT } from '~/utils/constants'
import crypto from 'crypto'

const verifyVnpayIpn = async (vnp_Params) => {
  const verifyResult = vnpayInstance.verifyIpnCall(vnp_Params)
  if (!verifyResult.isVerified) {
    return { RspCode: '97', Message: 'Checksum failed' }
  }

  const txnRef = vnp_Params['vnp_TxnRef']
  const amount = vnp_Params['vnp_Amount']
  const rspCode = vnp_Params['vnp_ResponseCode']
  const [orderId] = txnRef.split('_')
  const order = await orderModel.findOneById(orderId)
  if (!order) return { RspCode: '01', Message: 'Order not found' }
  const receivedAmount = parseInt(amount) / 100
  if (receivedAmount !== order.finalPrice) {
    return { RspCode: '04', Message: 'Invalid amount' }
  }

  if (order.payment.status === STATUS_PAYMENT.PAID) {
    return { RspCode: '02', Message: 'Order already confirmed' }
  }

  if (rspCode === '00') {
    await orderModel.updatePaymentStatus(orderId, {
      status: STATUS_PAYMENT.PAID,
      transactionId: vnp_Params['vnp_TransactionNo'],
      bankCode: vnp_Params['vnp_BankCode'],
      paidAt: Date.now()
    }, STATUS_ORDER.CONFIRMED)
  } else {
    await orderModel.updatePaymentStatus(orderId, {
      status: STATUS_PAYMENT.FAILED,
      transactionId: null,
      bankCode: null,
      paidAt: null
    }, STATUS_ORDER.PENDING)
  }

  return { RspCode: '00', Message: 'Confirm Success' }
}

const verifyMomoCallback = async (momoParams) => {
  const {
    partnerCode, orderId, requestId, amount, orderInfo, orderType,
    transId, resultCode, message, payType, responseTime, extraData, signature
  } = momoParams

  const accessKey = process.env.MOMO_ACCESS_KEY
  const secretKey = process.env.MOMO_SECRET_KEY

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`

  const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex')

  if (signature !== expectedSignature) {
    return { RspCode: '97', Message: 'Checksum failed' }
  }

  const [realOrderId] = orderId.split('_')

  const order = await orderModel.findOneById(realOrderId)
  if (!order) return { RspCode: '01', Message: 'Order not found' }

  if (order.payment.status === STATUS_PAYMENT.PAID) {
    return { RspCode: '02', Message: 'Order already confirmed' }
  }

  if (String(resultCode) === '0') {
    await orderModel.updatePaymentStatus(realOrderId, {
      status: STATUS_PAYMENT.PAID,
      transactionId: transId,
      paidAt: Date.now()
    }, STATUS_ORDER.CONFIRMED)
  } else {
    await orderModel.updatePaymentStatus(realOrderId, {
      status: STATUS_PAYMENT.FAILED,
      transactionId: transId,
      paidAt: null
    }, STATUS_ORDER.PENDING)
  }

  return { RspCode: '00', Message: 'Success', resultCode }
}

export const paymentService = {
  verifyVnpayIpn,
  verifyMomoCallback
}