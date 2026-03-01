import { userModel } from '~/models/userModel'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { env } from '~/config/enviroment'
import { jwtProvider } from '~/providers/jwtProvider'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { BrevoProvider } from '~/providers/BrevoProvider'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatter'
import bcryptjs from 'bcryptjs'
import { USER_ROLE } from '~/utils/constants'
import { DEFAULT_PAGE, DEFAULT_ITEM_PER_PAGE } from '~/utils/constants'

const createNew = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) throw new ApiError(StatusCodes.CONFLICT, 'Email đã tồn tại!')

    const name = reqBody.email.split('@')[0]

    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 10),
      fullName: reqBody.fullName,
      phone: reqBody.phone,
      displayName: name,
      verifyToken: uuidv4(),
      role: USER_ROLE.CLIENT
    }

    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const customSubject = 'REBUY MARKET: Xác thực tài khoản của bạn'

    const userName = createdUser.fullName

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2d3436; max-width: 600px; margin: 20px auto; border: none; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">

        <div style="background: linear-gradient(135deg, #27ae60, #2ecc71); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; text-transform: uppercase;">REBUY MARKET</h1>
        </div>

        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #27ae60; margin-top: 0; font-size: 22px; border-bottom: 2px solid #f1f2f6; padding-bottom: 10px;">Xác thực tài khoản</h2>

          <p style="font-size: 16px;">Xin chào <strong>${userName}</strong>,</p>
          
          <p style="color: #636e72;">Chào mừng bạn đến với cộng đồng <strong>REBUY MARKET</strong>. Chúng tôi rất vui khi bạn đồng hành cùng chúng tôi. Chỉ còn một bước cuối cùng để kích hoạt hành trình mua sắm của bạn:</p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${verificationLink}" target="_blank" style="background-color: #27ae60; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s ease; box-shadow: 0 4px 6px rgba(39, 174, 96, 0.2);">
              KÍCH HOẠT TÀI KHOẢN
            </a>
          </div>

          <div style="background-color: #f9fdfa; border-left: 4px solid #27ae60; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0; font-size: 14px; color: #2d3436;">
              <strong>Lưu ý:</strong> Đường dẫn này sẽ hết hiệu lực sau <strong>24 giờ</strong> để đảm bảo an toàn cho tài khoản của bạn.
            </p>
          </div>

          <p style="font-size: 13px; color: #b2bec3;">Nếu nút phía trên không hiển thị, bạn vui lòng copy và dán liên kết dưới đây vào trình duyệt:</p>
          <p style="background-color: #f1f2f6; padding: 12px; border-radius: 8px; word-break: break-all; color: #27ae60; font-size: 12px; border: 1px dashed #cbd5e0;">
            ${verificationLink}
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 25px 20px; text-align: center; font-size: 12px; color: #95a5a6; border-top: 1px solid #edf2f7;">
          <p style="margin-bottom: 5px;">Bạn nhận được email này vì đã đăng ký tại REBUY MARKET.</p>
          <p style="margin-bottom: 15px;">Nếu không phải là bạn, hãy an tâm bỏ qua email này.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; width: 50%; margin: 15px auto;">
          <p style="font-weight: bold; color: #7f8c8d;">&copy; 2024 REBUY MARKET. All rights reserved.</p>
          <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
        </div>
      </div>
      `

    await BrevoProvider.sendEmail(getNewUser.email, customSubject, htmlContent)
    return pickUser(getNewUser)
  } catch (error) { throw error }
}

const verifyAccount = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)

    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tài khoản!')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Tài khoản đã được kích hoạt từ trước!')
    if (reqBody.token !== existUser.verifyToken) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token xác thực không hợp lệ!')

    const updateData = {
      isActive: true,
      verifyToken: null
    }

    const updatedUser = await userModel.update(existUser._id, updateData)

    return pickUser(updatedUser)
  } catch (error) { throw error }
}

const login = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (!existUser) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Email hoặc mật khẩu không chính xác!')

    if (!existUser.isActive) throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email!')

    const isMatch = await bcryptjs.compare(reqBody.password, existUser.password)
    if (!isMatch) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Email hoặc mật khẩu không chính xác!')

    const userInfo = {
      _id: existUser._id,
      email: existUser.email,
      role: existUser.role
    }

    const accessToken = await jwtProvider.generateToken(userInfo, env.ACCESS_TOKEN_SECRET_SIGNATURE, env.ACCESS_TOKEN_LIFE)
    const refreshToken = await jwtProvider.generateToken(userInfo, env.REFRESH_TOKEN_SECRET_SIGNATURE, env.REFRESH_TOKEN_LIFE)

    return {
      accessToken,
      refreshToken,
      ...pickUser(existUser)
    }
  } catch (error) { throw error }
}

const verifyToken = async (clientRefreshToken) => {
  try {
    const refreshTokenDecoded = await jwtProvider.verifyToken(clientRefreshToken, env.REFRESH_TOKEN_SECRET_SIGNATURE)

    const existUser = await userModel.findOneById(refreshTokenDecoded._id)
    if (!existUser) throw new ApiError(StatusCodes.UNAUTHORIZED, 'User không tồn tại!')

    const userInfo = {
      _id: existUser._id,
      email: existUser.email,
      role: existUser.role
    }

    const accessToken = await jwtProvider.generateToken(userInfo, env.ACCESS_TOKEN_SECRET_SIGNATURE, env.ACCESS_TOKEN_LIFE)

    return { accessToken }
  } catch (error) { throw error }
}

const update = async (userId, reqBody, reqFile) => {
  try {
    const existUser = await userModel.findOneById(userId)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tài khoản không tồn tại!')

    const updateData = { ...reqBody }

    if (reqBody.current_password && reqBody.new_password) {
      const isMatch = await bcryptjs.compare(reqBody.current_password, existUser.password)
      if (!isMatch) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Mật khẩu hiện tại không chính xác!')

      updateData.password = bcryptjs.hashSync(reqBody.new_password, 10)

      delete updateData.current_password
      delete updateData.new_password
    }

    if (reqFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(reqFile.buffer, 'user-rebuy-market')
      updateData.avatar = uploadResult.secure_url
    }

    if (!reqBody.current_password || !reqBody.new_password) {
      delete updateData.password
    }
    delete updateData.email
    delete updateData.role
    delete updateData.isActive

    const updatedUser = await userModel.update(userId, updateData)

    return pickUser(updatedUser)
  } catch (error) { throw error }
}

const getAdminUsers = async ({ page = DEFAULT_PAGE, limit = DEFAULT_ITEM_PER_PAGE, role, isActive }) => {
  try {
    const currentPage = parseInt(page, 10) || DEFAULT_PAGE
    const recordLimit = parseInt(limit, 10) || DEFAULT_ITEM_PER_PAGE
    const skip = (currentPage - 1) * recordLimit

    let matchCondition = {}

    if (role && role !== 'ALL') {
      matchCondition.role = role
    }

    if (isActive !== undefined && isActive !== 'ALL') {
      matchCondition.isActive = isActive === 'true'
    }

    const { users, totalUsers } = await userModel.getUsers(matchCondition, skip, recordLimit)

    return {
      users,
      pagination: {
        totalRecords: totalUsers,
        totalPages: Math.ceil(totalUsers / recordLimit),
        currentPage: currentPage,
        limit: recordLimit
      }
    }
  } catch (error) { throw error }
}

const updateUserStatus = async (userId, updateData) => {
  try {
    const dataToUpdate = {}
    if (updateData.role !== undefined) dataToUpdate.role = updateData.role
    if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive

    if (Object.keys(dataToUpdate).length === 0) {
      throw new Error('Không có dữ liệu hợp lệ để cập nhật!')
    }

    const updatedUser = await userModel.updateUserStatus(userId, dataToUpdate)

    return updatedUser
  } catch (error) { throw error }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  verifyToken,
  update,
  getAdminUsers,
  updateUserStatus
}