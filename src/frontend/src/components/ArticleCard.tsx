
import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../data/articles';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, featured = false }) => {
  return (
    <div className={`bg-white border border-news-border rounded-md overflow-hidden hover:shadow-md transition-shadow ${featured ? 'md:col-span-2 lg:col-span-2' : ''}`}>
      <Link to={`/article/${article.id}`}>
        <img 
          src={`https://source.unsplash.com${article.imageUrl}`}
          alt={article.title} 
          className={`w-full object-cover ${featured ? 'h-64' : 'h-48'}`}
        />
      </Link>
      <div className="p-4">
        <Link to={`/category/${article.category.toLowerCase()}`}>
          <span className="text-sm font-medium text-news-red">{article.category}</span>
        </Link>
        <Link to={`/article/${article.id}`}>
          <h3 className={`font-bold text-news-dark hover:text-news-red transition-colors ${featured ? 'text-xl mb-2' : 'text-lg'}`}>
            {article.title}
          </h3>
        </Link>
        <p className="text-news-gray mt-2 text-sm">
          {article.summary}
        </p>
        <div className="flex items-center justify-between mt-4 text-xs text-news-gray">
          <span>{article.date}</span>
          <span>{article.readTime}</span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
