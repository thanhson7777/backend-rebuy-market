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
      // Đảm bảo baseURL kết thúc ở /v2
      baseURL: env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2',
      headers: {
        'Content-Type': 'application/json',
        'token': env.GHN_TOKEN_API,
        'ShopId': Number(env.GHN_SHOP_ID) // Ép kiểu số cho ShopId
      }
    })
  }

  /**
   * Lấy danh sách Dịch Vụ giao hàng khả dụng giữa 2 quận.
   */
  async getAvailableServices(to_district_id) {
    try {
      const response = await this.apiHelper.post('/shipping-order/available-services', {
        shop_id: Number(env.GHN_SHOP_ID),
        from_district: Number(env.GHN_SHOP_DISTRICT_ID),
        to_district: Number(to_district_id)
      })

      if (response.data && response.data.code === 200) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('GHN getAvailableServices Error:', error.message)
      return []
    }
  }

  /**
   * Tính toán phí vận chuyển tự động
   */
  async calculateShippingFee(payload) {
    try {
      // 1. Chuẩn hóa và Validate dữ liệu đầu vào
      const toDistrictId = Number(payload.to_district_id)
      const toWardCode = String(payload.to_ward_code).trim()

      if (!toDistrictId || !toWardCode || toWardCode === 'undefined') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Thiếu DistrictID hoặc WardCode người nhận hợp lệ.')
      }

      // 2. Lấy service_id khả dụng (Tránh lỗi fix cứng service_type_id: 2 mà khu vực đó không hỗ trợ)
      const availableServices = await this.getAvailableServices(toDistrictId)
      if (!availableServices || availableServices.length === 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'GHN không hỗ trợ giao hàng đến địa chỉ này.')
      }

      // Ưu tiên lấy service đầu tiên (thường là chuẩn hoặc nhanh)
      const chosenService = availableServices[0]

      // 3. Xây dựng Payload chuẩn GHN
      const ghnPayload = {
        service_id: chosenService.service_id,
        service_type_id: null, // Ưu tiên dùng service_id đã lấy ở trên
        from_district_id: Number(env.GHN_SHOP_DISTRICT_ID),
        from_ward_code: String(env.GHN_SHOP_WARD_CODE),
        to_district_id: toDistrictId,
        to_ward_code: toWardCode,
        weight: Number(payload.weight) || 1000,
        length: Number(payload.length) || 15,
        width: Number(payload.width) || 15,
        height: Number(payload.height) || 15,
        insurance_value: Number(payload.insurance_value) || 0,
        coupon: null
      }

      // 4. Gọi API tính phí (Dùng endpoint /shipping-order/fee vì baseURL đã có /v2)
      const response = await this.apiHelper.post('/shipping-order/fee', ghnPayload)

      if (response.data && response.data.code === 200) {
        // Trả về tổng phí: total (bao gồm cả phí bảo hiểm nếu có)
        return response.data.data.total
      } else {
        throw new Error(response.data.message || 'Lỗi không xác định từ GHN')
      }

    } catch (error) {
      // Xử lý lỗi trả về từ Axios/GHN API
      if (error.response && error.response.data) {
        const ghnResp = error.response.data
        const message = ghnResp.message || JSON.stringify(ghnResp)

        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `GHN API Error: ${message}. Check DistrictID: ${payload.to_district_id}`
        )
      }

      // Lỗi logic hoặc kết nối
      if (error instanceof ApiError) throw error
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Lỗi hệ thống vận chuyển: ${error.message}`)
    }
  }

  // --- Các hàm Master Data giữ nguyên nhưng thêm ép kiểu an toàn ---

  async getProvinces() {
    try {
      const response = await this.apiHelper.get('/master-data/province')
      return response.data.data
    } catch (error) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Lỗi lấy Tỉnh/Thành: ${error.message}`)
    }
  }

  async getDistricts(provinceId) {
    try {
      const response = await this.apiHelper.get(`/master-data/district?province_id=${Number(provinceId)}`)
      return response.data.data
    } catch (error) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Lỗi lấy Quận/Huyện: ${error.message}`)
    }
  }

  async getWards(districtId) {
    try {
      const response = await this.apiHelper.get(`/master-data/ward?district_id=${Number(districtId)}`)
      return response.data.data
    } catch (error) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Lỗi lấy Phường/Xã: ${error.message}`)
    }
  }
}

export const ghnProvider = new GHNProvider()