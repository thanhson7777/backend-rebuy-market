import { VNPay } from 'vnpay'

export const vnpayInstance = new VNPay({
  tmnCode: process.env.VNP_TMN_CODE,
  secureSecret: process.env.VNP_HASH_SECRET,
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: 'SHA512',
  enableIPN: true,
  paymentEndpoint: 'paymentv2/vpcpay.html'
})