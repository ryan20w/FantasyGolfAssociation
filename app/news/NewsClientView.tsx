"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function NewsClientView({ articles }: { articles: any[] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Tour Update", "Power Rankings", "Platform Update", "Experts Rosters"];

  const filteredArticles = selectedCategory === "All" 
    ? articles 
    : articles.filter(article => article.category === selectedCategory);

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">The Fantasy Golf Association</h1>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-black">Home</Link>
            <Link href="/contact" className="text-gray-600 hover:text-black">Contact</Link>
            <Link
  href="/profile"
  className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
>
  Profile
</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Latest News & Insights</h2>
          <p className="text-gray-600 mt-1">Stay up to date with tour analysis, strategy guides, and platform updates.</p>
        </div>

<div className="flex gap-2 mb-8 overflow-x-auto pb-2">
  {categories.map((category) => (
    <button
      key={category}
      onClick={() => setSelectedCategory(category)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
        selectedCategory === category
          ? "bg-green-600 text-white"
          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
      }`}
    >
      {category}
    </button>
  ))}
</div>

        <div className="grid md:grid-cols-2 gap-6">
          {filteredArticles.map((article) => (
            <div key={article.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <span className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3">
                  {article.category}
                </span>
                <Link href={`/news/${article.id}`}>
                  <h4 className="text-xl font-bold text-gray-900 mb-2 hover:text-green-600 transition cursor-pointer">
                    {article.title}
                  </h4>
                </Link>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-500">
                <span>{article.date}</span>
                <Link href={`/news/${article.id}`} className="text-green-600 font-semibold hover:underline">
                  Read More &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
