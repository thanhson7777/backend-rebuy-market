import { StatusCodes } from 'http-status-codes'
import { ghnProvider } from '~/providers/GHNProvider'

const getProvinces = async (req, res, next) => {
  try {
    const data = await ghnProvider.getProvinces()
    res.status(StatusCodes.OK).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

const getDistricts = async (req, res, next) => {
  try {
    const provinceId = req.query.province_id
    const data = await ghnProvider.getDistricts(provinceId)
    res.status(StatusCodes.OK).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

const getWards = async (req, res, next) => {
  try {
    const districtId = req.query.district_id
    const data = await ghnProvider.getWards(districtId)
    res.status(StatusCodes.OK).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export const ghnController = {
  getProvinces,
  getDistricts,
  getWards
}
