
import React from 'react';
import { useParams } from 'react-router-dom';
import { articles } from '../data/articles';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  
  // Get articles for this category
  const categoryArticles = articles.filter(
    article => article.category.toLowerCase() === category?.toLowerCase()
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 pb-2 border-b border-news-border capitalize">
          {category} News
        </h1>
        
        {categoryArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-news-gray">No articles found in this category.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default CategoryPage;
