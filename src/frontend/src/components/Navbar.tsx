
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';

const categories = [
  "National",
  "Business", 
  "Politics",
  "Sports",
  "Entertainment",
  "Technology",
  "Health",
  "Science",
  "Education"
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-news-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-news-red">Times of India</h1>
          </Link>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search news..."
                className="py-1 pl-8 pr-4 border border-news-border rounded-md focus:outline-none focus:ring-1 focus:ring-news-red"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-news-gray" />
            </div>
          </div>
          
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        <nav className="hidden md:block py-2 border-t border-news-border">
          <ul className="flex flex-wrap justify-center space-x-4">
            <li>
              <Link to="/" className="font-medium text-news-dark hover:text-news-red transition-colors">Home</Link>
            </li>
            {categories.map((category) => (
              <li key={category}>
                <Link to={`/category/${category.toLowerCase()}`} className="font-medium text-news-dark hover:text-news-red transition-colors">
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-news-border shadow-md z-50">
          <div className="container mx-auto px-4 py-2">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search news..."
                className="w-full py-2 pl-8 pr-4 border border-news-border rounded-md focus:outline-none focus:ring-1 focus:ring-news-red"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-news-gray" />
            </div>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="block py-2 font-medium text-news-dark hover:text-news-red transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category}>
                  <Link 
                    to={`/category/${category.toLowerCase()}`} 
                    className="block py-2 font-medium text-news-dark hover:text-news-red transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
