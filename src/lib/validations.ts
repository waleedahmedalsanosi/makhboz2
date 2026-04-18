import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  phone: z.string().min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل'),
  role: z.enum(['BUYER', 'BAKER'] as const, {
    error: 'يجب اختيار نوع حساب صحيح',
  }),
  area: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().min(2, 'المنطقة يجب أن تكون حرفين على الأقل').optional()
  ),
}).refine(
  (data) => data.role !== 'BAKER' || !!data.area,
  { message: 'المنطقة مطلوبة للخباز', path: ['area'] }
)

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

export const productSchema = z.object({
  name: z.string().min(2, 'اسم المنتج يجب أن يكون حرفين على الأقل'),
  description: z.string().optional(),
  price: z.number().min(1, 'السعر يجب أن يكون أكبر من صفر'),
  category: z.enum(['KAAK', 'PETITFOUR', 'BISCUIT', 'MANIN'] as const, {
    error: 'يجب اختيار فئة صحيحة',
  }),
  area: z.string().min(2, 'المنطقة يجب أن تكون حرفين على الأقل'),
  unit: z.string().default('piece'),
  imageUrl: z.string().url('رابط الصورة غير صحيح').optional(),
  isAvailable: z.boolean().optional(),
})

export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1, 'الكمية يجب أن تكون على الأقل 1'),
  })).min(1, 'يجب إضافة منتج واحد على الأقل'),
  deliveryAddress: z.string().min(5, 'عنوان التوصيل يجب أن يكون 5 أحرف على الأقل'),
  paymentNote: z.string().optional(),
})
