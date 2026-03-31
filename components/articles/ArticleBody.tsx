import ReactMarkdown from 'react-markdown'

interface ArticleBodyProps {
  markdown: string
}

// Renders Markdown article body with Thai-friendly typography.
// This is a server component — ReactMarkdown works on the server side.
export function ArticleBody({ markdown }: ArticleBodyProps) {
  return (
    <div className="prose prose-gray max-w-none leading-relaxed text-gray-800
      prose-headings:font-semibold prose-headings:text-gray-900
      prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
      prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
      prose-p:mb-4 prose-p:leading-[1.8]
      prose-a:text-gold-600 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-gray-900
      prose-ul:space-y-1 prose-ol:space-y-1
      prose-li:leading-relaxed
      prose-blockquote:border-l-4 prose-blockquote:border-gold-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
      prose-img:rounded-card prose-img:shadow-card
      prose-hr:border-gray-100
    ">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  )
}
