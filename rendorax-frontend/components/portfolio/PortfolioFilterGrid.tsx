"use client";

import { useState } from "react";
import Link from "next/link";

export interface PortfolioProject {
  id: number;
  title: string;
  category: string;
  service: string;
  image: string;
  slug: string;
}

interface PortfolioFilterGridProps {
  projects: PortfolioProject[];
  categories: string[];
}

export default function PortfolioFilterGrid({
  projects,
  categories,
}: PortfolioFilterGridProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((project) => project.category === activeCategory);

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-6 mb-16">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 border-y border-white/5 py-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 ${
                activeCategory === category
                  ? "text-gold-primary border-b border-gold-primary pb-1"
                  : "text-text-gray hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <section className="w-full max-w-7xl mx-auto px-6 pb-32 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {filteredProjects.map((project) => (
            <div key={project.id} className="group relative cursor-pointer">
              <div className="relative w-full aspect-video overflow-hidden bg-bg-panel border border-white/5 mb-6">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-500 z-10 pointer-events-none"></div>

                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover filter grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                />

                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="bg-gold-primary text-black text-[9px] font-bold uppercase tracking-widest px-3 py-1">
                    View Case Study
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-display text-white mb-2 group-hover:text-gold-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-gray font-mono">
                    {project.service}
                  </p>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-text-gray/50 border border-white/10 px-2 py-1">
                  {project.category}
                </div>
              </div>

              <Link
                href={`/portfolio/${project.slug}`}
                className="absolute inset-0 z-30"
              >
                <span className="sr-only">View {project.title}</span>
              </Link>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20 text-text-gray text-sm uppercase tracking-widest">
            No projects found in this category.
          </div>
        )}
      </section>
    </>
  );
}
