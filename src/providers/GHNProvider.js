import axios from 'axios'
import { env } from '~/config/enviroment'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

/**
 * Service tích hợp Giao Hàng Nhanh (GHN) API
 */
class GHNProvider {
  constructor() {
    this.apiHelper = axios.create({
      baseURL: env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2',
      headers: {
        'Content-Type': 'application/json',
        'token': env.GHN_TOKEN_API,
        'ShopId': env.GHN_SHOP_ID
      }
    })
  }

  /**
   * Tính toán phí vận chuyển tự động bằng GHN API
   *
   * @param {Object} payload
   * @param {number} payload.to_district_id - Mã Huyện/Quận người nhận (GHN Master Data)
   * @param {string} payload.to_ward_code - Mã Xã/Phường người nhận (GHN Master Data)
   * @param {number} payload.weight - Tổng trọng lượng (gram)
   * @param {number} payload.length - Tổng chiều dài (cm)
   * @param {number} payload.width - Tổng chiều rộng (cm)
   * @param {number} payload.height - Tổng chiều cao (cm)
   * @param {number} payload.insurance_value - Tổng giá trị đơn hàng (dùng để tính phí bảo hiểm nếu có)
   * @returns {Promise<number>} Trả về số tiền ship (VNĐ)
   */
  async calculateShippingFee(payload) {
    try {
      const data = {
        // service_id: 53320, // Tắt cứng service_id để GHN tự tính theo service_type_id
        service_type_id: 2, // 2: Đi bộ/Giao chuẩn
        from_district_id: Number(env.GHN_SHOP_DISTRICT_ID),
        from_ward_code: env.GHN_SHOP_WARD_CODE,
        to_district_id: Number(payload.to_district_id),
        to_ward_code: payload.to_ward_code,
        weight: payload.weight > 0 ? payload.weight : 1000, // Đề phòng lỗi thiếu weight (mặc định 1kg)
        length: payload.length > 0 ? payload.length : 15,
        width: payload.width > 0 ? payload.width : 15,
        height: payload.height > 0 ? payload.height : 15,
        insurance_value: payload.insurance_value || 0,
        coupon: null
      }
      // console.log('--- DỮ LIỆU ĐẨY LÊN API GHN ---: ', data)
      const response = await this.apiHelper.post('/shipping-order/fee', data)
      if (response.data && response.data.code === 200) {
        return response.data.data.total
      } else {
        throw new Error(response.data.message || 'Lỗi tính phí từ hệ thống GHN')
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `GHN Error: ${error.response.data.message}`)
      }
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Lỗi kết nối nhà vận chuyển: ${error.message}`)
    }
  }

  /**
   * Lấy danh sách Dịch Vụ giao hàng để get service_id tương ứng giữa 2 quận.
   */
  async getAvailableServices(to_district_id) {
    try {
      const response = await this.apiHelper.post('/shipping-order/available-services', {
        shop_id: Number(env.GHN_SHOP_ID),
        from_district: Number(env.GHN_SHOP_DISTRICT_ID),
        to_district: Number(to_district_id)
      })
      if (response.data.code === 200) {
        return response.data.data
      }
      return []
    } catch (error) {
      return []
    }
  }
}

export const ghnProvider = new GHNProvider()