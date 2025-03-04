'use client'

import { useState, useEffect } from 'react'
import { Product } from '@prisma/client'
import {
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material'
import ProductImageUpload from './ProductImageUpload'
import type { ProductImage } from './ProductImageUpload'

interface ProductWithImages extends Product {
  images: ProductImage[]
}

interface Props {
  product?: ProductWithImages
  onSubmit: (product: Partial<Product>) => Promise<void>
}

export default function ProductForm({ product, onSubmit }: Props) {
  const [formData, setFormData] = useState<Partial<Product>>({
    itemNo: '',
    barcode: '',
    description: '',
    cost: 0,
    supplier: '',
    category: '',
    color: '',
    material: '',
    productSize: '',
    cartonSize: '',
    cartonWeight: 0,
    moq: 0,
    link1688: '',
    ...product
  })

  const [images, setImages] = useState<ProductImage[]>(product?.images || [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <Paper className="p-6">
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* 图片上传区域 */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4">
              产品图片
            </Typography>
            <ProductImageUpload
              productId={product?.id || ''}
              images={images}
              onImagesChange={setImages}
            />
          </Grid>

          {/* 基本信息 */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4">
              基本信息
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="商品编号"
              name="itemNo"
              value={formData.itemNo}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="条形码"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="商品描述"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="成本"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="供应商"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
            />
          </Grid>

          {/* 分类信息 */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4">
              分类信息
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="类别"
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="颜色"
              name="color"
              value={formData.color}
              onChange={handleChange}
            />
          </Grid>

          {/* 规格信息 */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4">
              规格信息
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="材质"
              name="material"
              value={formData.material}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="产品尺寸"
              name="productSize"
              value={formData.productSize}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="箱规"
              name="cartonSize"
              value={formData.cartonSize}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="箱重"
              name="cartonWeight"
              value={formData.cartonWeight}
              onChange={handleChange}
            />
          </Grid>

          {/* 其他信息 */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4">
              其他信息
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="最小订量"
              name="moq"
              value={formData.moq}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="1688链接"
              name="link1688"
              value={formData.link1688}
              onChange={handleChange}
            />
          </Grid>

          {/* 提交按钮 */}
          <Grid item xs={12}>
            <Box className="flex justify-end mt-4">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
              >
                保存
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
} 