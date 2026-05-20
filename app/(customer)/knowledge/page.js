"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { useGymLogo } from "@/lib/hooks/useGymLogo";

const mockCategories = [
  { id: "all", name: "All", icon: "📚" },
  { id: "tips", name: "Fitness Tips", icon: "💪" },
  { id: "injury", name: "Injury Prevention", icon: "🩹" },
  { id: "nutrition", name: "Nutrition", icon: "🥗" },
  { id: "announcements", name: "Announcements", icon: "📢" },
];

const mockArticles = [
  {
    id: 1,
    title: "5 Best Warm-Up Exercises Before Workout",
    category: "tips",
    excerpt:
      "Proper warm-up prevents injuries and improves performance. Here are the top 5 exercises...",
    readTime: "3 min",
    date: "Jan 15",
    featured: true,
    image: null,
  },
  {
    id: 2,
    title: "How to Prevent Lower Back Pain",
    category: "injury",
    excerpt:
      "Lower back pain is common among gym-goers. Learn proper form and exercises to avoid it...",
    readTime: "5 min",
    date: "Jan 14",
    featured: false,
  },
  {
    id: 3,
    title: "Post-Workout Nutrition Guide",
    category: "nutrition",
    excerpt:
      "What you eat after workout matters. Here's your complete guide to post-workout meals...",
    readTime: "4 min",
    date: "Jan 13",
    featured: true,
  },
  {
    id: 4,
    title: "🎉 New Equipment Arrived!",
    category: "announcements",
    excerpt:
      "We've added new cable machines and dumbbells to our gym. Check them out!",
    readTime: "1 min",
    date: "Jan 12",
    featured: false,
    isNew: true,
  },
  {
    id: 5,
    title: "Importance of Rest Days",
    category: "tips",
    excerpt:
      "Rest days are crucial for muscle recovery and growth. Learn why you shouldn't skip them...",
    readTime: "3 min",
    date: "Jan 11",
    featured: false,
  },
  {
    id: 6,
    title: "Shoulder Injury Prevention",
    category: "injury",
    excerpt:
      "Shoulder injuries are preventable with proper technique. Here's how to protect yourself...",
    readTime: "4 min",
    date: "Jan 10",
    featured: false,
  },
  {
    id: 7,
    title: "Protein Requirements for Muscle Building",
    category: "nutrition",
    excerpt:
      "How much protein do you really need? We break down the science behind protein intake...",
    readTime: "5 min",
    date: "Jan 09",
    featured: false,
  },
  {
    id: 8,
    title: "⏰ New Gym Timings from Feb 1",
    category: "announcements",
    excerpt:
      "Starting February, gym will open at 5 AM on weekdays. Check the new schedule...",
    readTime: "1 min",
    date: "Jan 08",
    featured: false,
  },
];

export default function KnowledgePage() {
  const router = useRouter();
  const gymLogo = useGymLogo();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = mockArticles.filter((article) => {
    const matchesCategory =
      activeCategory === "all" || article.category === activeCategory;
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = mockArticles.filter((a) => a.featured);
  const announcements = mockArticles.filter(
    (a) => a.category === "announcements"
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Knowledge Hub" showBack={false} gymLogo={gymLogo} />

      <main className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search articles..."
            className="w-full px-4 py-3 pl-10 bg-white border border-gray-200 rounded-xl outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>

        {/* Announcements Banner */}
        {announcements.length > 0 &&
          activeCategory === "all" &&
          !searchQuery && (
            <div
              onClick={() => router.push(`/knowledge/${announcements[0].id}`)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <span>📢</span>
                <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                  Announcement
                </span>
              </div>
              <p className="font-semibold">{announcements[0].title}</p>
              <p className="text-sm text-orange-100 mt-1">
                {announcements[0].excerpt}
              </p>
            </div>
          )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {mockCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Featured Section */}
        {activeCategory === "all" && !searchQuery && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Featured</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {featuredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => router.push(`/knowledge/${article.id}`)}
                  className="min-w-[260px] bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer"
                >
                  <div className="h-24 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <span className="text-4xl">
                      {article.category === "tips"
                        ? "💪"
                        : article.category === "nutrition"
                        ? "🥗"
                        : "📚"}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {article.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {article.readTime} read • {article.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Articles List */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            {activeCategory === "all"
              ? "All Articles"
              : mockCategories.find((c) => c.id === activeCategory)?.name}
          </h3>
          <div className="space-y-3">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => router.push(`/knowledge/${article.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm cursor-pointer"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-2xl">
                      {article.category === "tips"
                        ? "💪"
                        : article.category === "injury"
                        ? "🩹"
                        : article.category === "nutrition"
                        ? "🥗"
                        : "📢"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {article.title}
                      </p>
                      {article.isNew && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{article.readTime} read</span>
                      <span>•</span>
                      <span>{article.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-8">
            <span className="text-4xl">📭</span>
            <p className="text-gray-500 mt-2">No articles found</p>
          </div>
        )}
      </main>
    </div>
  );
}
