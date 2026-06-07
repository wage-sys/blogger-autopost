import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const TOPICS = [
  "Tips produktivitas kerja dari rumah",
  "Cara investasi saham untuk pemula",
  "Resep masakan sehat dan murah",
  "Tutorial Python untuk pemula",
  "Tips hemat belanja bulanan",
  "Cara memulai bisnis online",
]

async function getAccessToken() {
  const res = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: process.env.BLOGGER_CLIENT_ID,
    client_secret: process.env.BLOGGER_CLIENT_SECRET,
    refresh_token: process.env.BLOGGER_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  })
  return res.data.access_token
}

async function generateArticle(topic: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = `Tulis artikel blog bahasa Indonesia tentang: "${topic}"
  
Balas HANYA dengan JSON tanpa backtick, format:
{
  "title": "judul artikel menarik dan SEO friendly",
  "content": "isi artikel dalam format HTML menggunakan tag h2, p, ul, strong. Minimal 600 kata.",
  "labels": ["tag1", "tag2", "tag3"]
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(text)
}

async function postToBlogger(article: any, token: string) {
  const res = await axios.post(
    `https://www.googleapis.com/blogger/v3/blogs/${process.env.BLOGGER_BLOG_ID}/posts`,
    {
      title: article.title,
      content: article.content,
      labels: article.labels,
      status: 'LIVE'
    },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return res.data
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    if (searchParams.get('secret') !== 'rahasiasuper123') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
    }

    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
    
    const [article, token] = await Promise.all([
      generateArticle(topic),
      getAccessToken()
    ])
    
    const post = await postToBlogger(article, token)
    
    return NextResponse.json({
      success: true,
      postId: post.id,
      title: post.title,
      url: post.url
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}