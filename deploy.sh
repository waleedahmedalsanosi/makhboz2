#!/bin/bash

echo "🚀 نشر مخبوز على Vercel..."

# التحقق من Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI غير مثبت. جاري التثبيت..."
    npm install -g vercel
fi

# نشر المشروع
echo "📦 جاري رفع المشروع..."
vercel --prod --yes

echo "✅ تم النشر! تحقق من حسابك على Vercel."
