import { StatusCodes } from 'http-status-codes'
import { orderModel } from '~/models/orderModel'
import { userModel } from '~/models/userModel'
import { contactModel } from '~/models/contactModel'
import { GET_DB } from '~/config/mongodb'

const getDashboardStats = async (req, res, next) => {
  try {
    const totalOrdersCount = await orderModel.countTotalOrders()
    const revenueResult = await orderModel.calculateTotalRevenue()
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0
    const totalClientsCount = await GET_DB().collection(userModel.USER_COLLECTION_NAME).countDocuments({ role: 'client' })
    const newContactsCount = await GET_DB().collection(contactModel.CONTACT_COLLECTION_NAME).countDocuments({ status: 'NEW', _destroy: false })
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - 7)
    const revenueChartDataRaw = await orderModel.getRevenueOverTime(targetDate)
    const revenueChartData = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const f = revenueChartDataRaw.find((item) => item._id === dateStr)
      revenueChartData.push({
        date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        revenue: f ? f.dailyRevenue : 0
      })
    }
    const orderStatusRaw = await orderModel.getOrderStatusStats()
    const orderStatusChartData = orderStatusRaw.map(status => ({
      status: status._id,
      count: status.count
    }))
    const recentOrders = await orderModel.getRecentOrders(5)
    const recentContacts = await GET_DB().collection(contactModel.CONTACT_COLLECTION_NAME)
      .find({ _destroy: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    const stats = {
      kpis: {
        newOrders: totalOrdersCount,
        newUsers: totalClientsCount,
        newContacts: newContactsCount,
        revenue: totalRevenue
      },
      revenueChartData,
      orderStatusChartData,
      recentOrders,
      recentContacts
    }

    res.status(StatusCodes.OK).json(stats)
  } catch (error) {
    next(error)
  }
}

export const dashboardController = {
  getDashboardStats
}