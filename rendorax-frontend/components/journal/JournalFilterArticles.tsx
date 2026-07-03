"use client";

import { useState } from "react";
import Link from "next/link";

export interface JournalArticle {
  id: number;
  title: string;
  category: string;
  readTime: string;
  date: string;
  excerpt: string;
  slug: string;
}

interface JournalFilterArticlesProps {
  articles: JournalArticle[];
  categories: string[];
}

export default function JournalFilterArticles({
  articles,
  categories,
}: JournalFilterArticlesProps) {
  const [activeCategory, setActiveCategory] = useState("All Articles");

  const filteredArticles =
    activeCategory === "All Articles"
      ? articles
      : articles.filter((article) => article.category === activeCategory);

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-wrap items-center gap-4 md:gap-8 border-b border-white/5 pb-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 pb-2 border-b-2 ${
                activeCategory === category
                  ? "text-gold-primary border-gold-primary font-bold"
                  : "text-text-gray border-transparent hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <section className="w-full max-w-7xl mx-auto px-6 pb-32 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="group cursor-pointer flex flex-col border border-white/5 p-8 bg-bg-panel hover:border-gold-primary/30 transition-all duration-500"
            >
              <Link href={`/journal/${article.slug}`}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-gold-primary border border-gold-primary/30 px-2 py-1">
                    {article.category}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-text-gray/50 font-mono">
                    {article.readTime}
                  </span>
                </div>

                <h3 className="text-2xl md:text-3xl font-display text-white mb-4 group-hover:text-gold-primary transition-colors leading-snug">
                  {article.title}
                </h3>

                <p className="text-sm text-text-gray leading-relaxed mb-6 flex-grow">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                  <span className="text-[10px] uppercase tracking-widest text-text-gray/50 font-mono">
                    {article.date}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-white group-hover:text-gold-primary transition-colors flex items-center gap-2">
                    Read Article{" "}
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-20 text-text-gray text-sm uppercase tracking-widest">
            No articles found in this category.
          </div>
        )}
      </section>
    </>
  );
}
