import Link from 'next/link';
import { getAllArticles } from '@/app/lib/Articles';

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const articles = getAllArticles();
  
  // This matches the file name (e.g. "article1")
  const article = articles.find((a) => a.id === id);

  if (!article) {
    return (
      <main className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <p className="text-gray-600 mb-4">Could not find article with ID: {id}</p>
        <Link href="/news" className="text-emerald-600 hover:underline">&larr; Back to News</Link>
      </main>
    );
  }

  return (
    <main className="pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        <Link href="/news" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to News</Link>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12 bg-white mt-4 rounded-2xl shadow-sm border border-gray-200">
        <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          {article.category}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-4 border-b border-gray-100">
          <span>{article.date}</span>
        </div>
        
        {/* Paragraph splitting logic applied here */}
        <div className="text-gray-700 leading-relaxed text-lg space-y-4">
          {article.content.split(/\r?\n\r?\n/).map((paragraph: string, index: number) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}