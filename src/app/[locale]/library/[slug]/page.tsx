import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface Article {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  author: string
  published_at: string
  status: string
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { article } = await getArticle(slug)

  if (!article) {
    return {
      title: '文章未找到 - 灵境阁'
    }
  }

  return {
    title: `${article.title} - 灵境阁`,
    description: article.summary
  }
}

async function getArticle(slug: string): Promise<{ article: Article | null; error: string | null }> {
  console.log('========== 开始获取文章详情 ==========')
  console.log('文章 slug:', slug)
  console.log('Supabase 配置状态:', isSupabaseConfigured() ? '已配置' : '未配置')

  if (!isSupabaseConfigured()) {
    const errorMsg = 'Supabase 环境变量未配置，请检查 .env.local 文件'
    console.error(errorMsg)
    return { article: null, error: errorMsg }
  }

  try {
    console.log('开始查询 articles...')

    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, summary, content, author, published_at, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    console.log('查询响应 - data:', data)
    console.log('查询响应 - error:', error)

    if (error) {
      console.error('查询错误:', error)
      return { article: null, error: `查询失败: ${error.message}` }
    }

    console.log('成功获取文章:', (data as Article | null)?.title)

    return { article: data as Article || null, error: null }
  } catch (err) {
    const errorMsg = `获取文章详情异常: ${err instanceof Error ? err.message : '未知错误'}`
    console.error(errorMsg)
    return { article: null, error: errorMsg }
  }
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params
  const { article, error } = await getArticle(slug)

  if (error) {
    return (
      <div className="min-h-screen bg-zen-beige">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link
            href={`/${locale}/library`}
            className="inline-flex items-center text-zen-ink/60 hover:text-zen-ink mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回文章列表
          </Link>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-600 font-semibold mb-2">加载失败</h3>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zen-beige">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href={`/${locale}/library`}
          className="inline-flex items-center text-zen-ink/60 hover:text-zen-ink mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回文章列表
        </Link>

        <article className="bg-white rounded-lg shadow-md p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-zen-ink mb-4">{article.title}</h1>
            <div className="flex items-center text-zen-ink/50">
              <span className="flex items-center mr-6">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {article.author}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {article.published_at ? format(new Date(article.published_at), 'yyyy年MM月dd日', { locale: zhCN }) : ''}
              </span>
            </div>
          </header>

          <div className="prose prose-lg text-zen-ink">
            <p className="text-lg text-zen-ink/80 mb-6">{article.summary}</p>
            <div 
              className="whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/library`}
            className="inline-flex items-center px-6 py-3 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            浏览更多文章
          </Link>
        </div>
      </div>
    </div>
  )
}
