import { StatusCodes } from 'http-status-codes'
import { contactService } from '~/services/contactService'

const createNew = async (req, res, next) => {
  try {
    const createdContact = await contactService.createNew(req.body)
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Tạo mới liên hệ thành công',
      data: createdContact
    })
  } catch (error) { next(error) }
}

const getContacts = async (req, res, next) => {
  try {
    const result = await contactService.getContacts()
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Lấy danh sách liên hệ thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const result = await contactService.getDetails(req.params.id)
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Lấy chi tiết liên hệ thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const contactId = req.params.id
    const updatedContact = await contactService.update(contactId, req.body)
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Cập nhật liên hệ thành công',
      data: updatedContact
    })
  } catch (error) {
    next(error)
  }
}

const deleteItem = async (req, res, next) => {
  try {
    const contactId = req.params.id
    const contact = await contactService.deleteItem(contactId)

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: contact.deleteResult
    })
  } catch (error) { next(error) }
}

export const contactController = {
  createNew,
  getContacts,
  getDetails,
  update,
  deleteItem
}
