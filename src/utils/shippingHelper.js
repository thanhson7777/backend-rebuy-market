const FREE_SHIP_THRESHOLD = 20000000
const FEE_INNER_CITY = 100000
const FEE_OUTER_CITY = 200000
const FEE_OTHER_PROVINCES = 300000

// Danh sách các quận nội ô (Gần kho hàng ở Cần Thơ)
const INNER_DISTRICTS = [
  'Quận Ninh Kiều',
  'Quận Bình Thủy',
  'Quận Cái Răng',
  'Quận Ô Môn'
]

/**
 * Hàm tính toán phí vận chuyển tự động
 * @param {string} province - Tỉnh / Thành phố
 * @param {string} district - Quận / Huyện
 * @param {number} totalProductPrice - Tổng tiền hàng hóa (Chưa tính giảm giá)
 * @returns {number} - Phí vận chuyển
 */
const calculateShippingFee = (province, district, totalProductPrice) => {
  // 1. Ưu tiên cao nhất: Khách VIP mua sỉ, đơn hàng lớn -> Miễn phí giao hàng
  if (totalProductPrice >= FREE_SHIP_THRESHOLD) {
    return 0
  }

  // Tiền xử lý chuỗi để tránh lỗi gõ phím của Frontend (Ví dụ: "Cần Thơ" vs "Thành phố Cần Thơ")
  const normalizedProvince = province.trim()
  const normalizedDistrict = district.trim()

  // 2. Tính phí theo phân vùng
  if (normalizedProvince.includes('Cần Thơ')) {
    // Nếu là nội ô
    if (INNER_DISTRICTS.includes(normalizedDistrict)) {
      return FEE_INNER_CITY
    }
    // Nếu là ngoại thành (Phong Điền, Cờ Đỏ, Thới Lai, Vĩnh Thạnh...)
    return FEE_OUTER_CITY
  }

  // 3. Khách ở các tỉnh khác (Hậu Giang, Vĩnh Long, Sóc Trăng...)
  return FEE_OTHER_PROVINCES
}

export const shippingHelper = {
  calculateShippingFee
}