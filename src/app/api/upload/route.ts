import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'غير مصرح' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const purpose = formData.get('purpose') as string | null // 'proof' | 'product'

  if (!file) return Response.json({ error: 'لم يتم إرسال ملف' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const isProof = purpose === 'proof'

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: isProof ? 'makhboz/proofs' : 'makhboz/products',
        type: isProof ? 'authenticated' : 'upload',
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve(result)
      }
    )
    stream.end(buffer)
  })

  return Response.json({ url: result.secure_url })
}
