import { slugify } from '~/utils/formatter'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { productModel } from '~/models/productModel'
import { DEFAULT_PAGE, DEFAULT_ITEM_PER_PAGE } from '~/utils/constants'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { categoryModel } from '~/models/categoryModel'

const createNew = async (reqBody, reqFiles) => {
  try {
    const newProductData = {
      ...reqBody,
      slug: slugify(reqBody.name)
    }

    if (!newProductData.image) {
      newProductData.image = []
    } else if (!Array.isArray(newProductData.image)) {
      newProductData.image = [newProductData.image]
    }

    const foundCategory = await categoryModel.findOneById(reqBody.categoryId)
    if (!foundCategory) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Danh mục không tồn tại!')
    }

    if (reqFiles && reqFiles.length > 0) {
      const uploadPromises = reqFiles.map(file =>
        CloudinaryProvider.streamUpload(file.buffer, 'image-product-rebuy-market')
      )
      const uploadResults = await Promise.all(uploadPromises)
      const uploadedUrls = uploadResults.map(result => result.secure_url)
      newProductData.image = [...newProductData.image, ...uploadedUrls]
    }

    const createdProduct = await productModel.createNew(newProductData)
    const getNewProduct = await productModel.findOneById(createdProduct.insertedId)
    return getNewProduct
  } catch (error) { throw error }
}

const getProducts = async (page, itemsPerPage, filters = {}) => {
  try {
    if (!page) page = DEFAULT_PAGE
    if (!itemsPerPage) itemsPerPage = DEFAULT_ITEM_PER_PAGE

    const results = await productModel.getProducts(
      parseInt(page, 10),
      parseInt(itemsPerPage, 10),
      filters
    )

    return results
  } catch (error) { throw new Error(error) }
}

const searchProducts = async (keyword) => {
  try {
    const products = await productModel.searchProducts(keyword)
    return products
  } catch (error) { throw new Error(error) }
}

const getDetails = async (productId) => {
  const product = await productModel.findOneById(productId)
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'không tìm thấy sản phẩm')
  return product
}

const update = async (productId, reqBody, reqFiles) => {
  try {
    const updateData = {
      ...reqBody
    }

    if (updateData.image !== undefined) {
      if (updateData.image === null || updateData.image === '') {
        updateData.image = []
      } else if (!Array.isArray(updateData.image)) {
        updateData.image = [updateData.image]
      }
    }

    if (reqFiles && reqFiles.length > 0) {
      const uploadPromises = reqFiles.map(file =>
        CloudinaryProvider.streamUpload(file.buffer, 'image-product-rebuy-market')
      )
      const uploadResults = await Promise.all(uploadPromises)
      const uploadedUrls = uploadResults.map(result => result.secure_url)
      updateData.image = updateData.image ? [...updateData.image, ...uploadedUrls] : [...uploadedUrls]
    }

    if (updateData.name) {
      updateData.slug = slugify(updateData.name)
    }

    const updatedData = await productModel.update(productId, updateData)
    return updatedData
  } catch (error) { throw error }
}

const deleteItem = async (productId) => {
  try {
    const product = await productModel.findOneById(productId)
    if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy sản phẩm')
    await productModel.deleteByOneId(productId)
    return { deleteResult: 'Đã xóa thành công!' }
  } catch (error) { throw error }
}

const getAdminProducts = async () => {
  const products = await productModel.getAdminProducts()
  return products
}

const restoreItem = async (productId) => {
  const restoredProduct = await productModel.restoreProduct(productId)
  if (!restoredProduct) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy sản phẩm để khôi phục!')
  }
  return restoredProduct
}

const forceDeleteItem = async (productId) => {
  const result = await productModel.forceDeleteProduct(productId)
  if (result.deletedCount === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại hoặc đã bị xóa!')
  }
  return { message: 'Đã xóa vĩnh viễn sản phẩm thành công!' }
}

export const productService = {
  createNew,
  getProducts,
  searchProducts,
  getDetails,
  update,
  deleteItem,
  getAdminProducts,
  restoreItem,
  forceDeleteItem
}
