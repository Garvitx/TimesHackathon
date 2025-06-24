// src/pages/ArticleDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articles } from '../data/articles';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import { Button } from '@/components/ui/button';

const API_BASE = 'https://stingray-app-j7k4v.ondigitalocean.app/';  // adjust to your backend URL or use an env var

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const article = articles.find(a => a.id === Number(id));
  const relatedArticles = articles
    .filter(a => a.category === article?.category && a.id !== article?.id)
    .slice(0, 3);

  useEffect(() => {
    setShowSummary(false);
    setSummary('');
    setError(null);
  }, [id]);

  const handleSummarize = async () => {
    if (!article) return;
    if (showSummary) {
      // Toggle back to full article view
      return setShowSummary(false);
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1) Fetch a short-lived handshake token
      const keyResp = await fetch(`${API_BASE}/api/key`);
      if (!keyResp.ok) {
        throw new Error('Could not obtain access token');
      }
      const { token } = await keyResp.json();

      // 2) Send the summarize request with the token header
      const payload = {
        articleId: article.id,
        title:     article.title,
        text:      article.content,
      };

      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Summarize failed (${res.status})`);
      }
      const { summary_html } = await res.json();
      setSummary(summary_html);
      setShowSummary(true);
    } catch (err) {
      console.error(err);
      setError('Failed to load summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <p className="mb-4">The article you're looking for doesn't exist.</p>
          <Link to="/" className="text-news-red hover:underline">Return to Home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to={`/category/${article.category.toLowerCase()}`}
            className="inline-block mb-4 text-sm font-medium text-news-red hover:underline"
          >
            {article.category}
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-news-dark mb-4">
            {article.title}
          </h1>
          <div className="flex items-center text-news-gray mb-6">
            <span className="mr-4">By {article.author}</span>
            <span className="mr-4">|</span>
            <span className="mr-4">{article.date}</span>
            <span>{article.readTime}</span>
          </div>

          <img
            src={`https://source.unsplash.com${article.imageUrl}`}
            alt={article.title}
            className="w-full h-auto max-h-[500px] object-cover rounded-md mb-6"
          />

          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              className="border-news-red text-news-red hover:bg-news-red hover:text-white"
              onClick={handleSummarize}
              disabled={isLoading}
            >
              {isLoading
                ? 'Loading...'
                : showSummary
                  ? 'View Full Article'
                  : 'Summarize Article'}
            </Button>
            <div className="flex space-x-2">{/* share icons */}</div>
          </div>

          <div className="prose max-w-none">
            {isLoading ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Summary</h3>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ) : showSummary ? (
              <>
                <h3 className="text-xl font-bold mb-4">Summary</h3>
                {error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  <div
                    className="text-news-dark mb-6 bg-gray-50 p-4 rounded-md border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: summary }}
                  />
                )}
                <Button
                  variant="link"
                  className="p-0 text-news-red"
                  onClick={() => setShowSummary(false)}
                >
                  Read full article
                </Button>
              </>
            ) : (
              <div className="text-news-dark">
                {article.content.split('\n\n').map((p, i) => (
                  <p key={i} className="mb-4">{p}</p>
                ))}
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto mt-12">
            <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-news-border">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticleDetail;
