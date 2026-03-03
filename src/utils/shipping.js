const FREE_SHIP_THRESHOLD = 20000000
const FEE_INNER_CITY = 30000
const FEE_OUTER_CITY = 500000
const FEE_OTHER_PROVINCES = 100000

const INNER_DISTRICTS = [
  'Quận Ninh Kiều',
  'Quận Bình Thủy',
  'Quận Cái Răng',
  'Quận Ô Môn'
]

const calculateShippingFee = (province, district, totalProductPrice) => {
  if (!province || !district) return 0
  if (totalProductPrice >= FREE_SHIP_THRESHOLD) {
    return 0
  }
  const normalizedProvince = province.trim()
  const normalizedDistrict = district.trim()
  if (normalizedProvince.includes('Cần Thơ')) {
    if (INNER_DISTRICTS.includes(normalizedDistrict)) {
      return FEE_INNER_CITY
    }
    return FEE_OUTER_CITY
  }
  return FEE_OTHER_PROVINCES
}

export const shippingHelper = {
  calculateShippingFee
}
