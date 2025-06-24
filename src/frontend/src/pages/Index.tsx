
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import { articles } from '../data/articles';

const Index = () => {
  // Featured articles (first 3)
  const featuredArticles = articles.slice(0, 3);
  
  // Latest news (the rest)
  const latestNews = articles.slice(3);
  
  // Get articles by category
  const getArticlesByCategory = (category: string) => {
    return articles.filter(article => article.category.toLowerCase() === category.toLowerCase());
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Featured News Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-news-border">Featured News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article, index) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                featured={index === 0}
              />
            ))}
          </div>
        </section>
        
        {/* Latest News Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-news-border">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNews.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
        
        {/* Categories Sections */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-news-border">Business</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getArticlesByCategory('business').slice(0, 3).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
        
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-news-border">Science & Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...getArticlesByCategory('science'), ...getArticlesByCategory('technology')].slice(0, 3).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
