import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ParticlesBackground from '../components/ParticlesBackground';
import FloatingEmojis from '../components/FloatingEmojis';
import ApiService from '../services/api';

export default function LinkoGenei() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [extensionToken, setExtensionToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_posts: 0, total_categories: 0 });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedPlatform]);

  useEffect(() => {
    // Check extension status on mount
    checkExtensionStatus();
  }, []);

  const checkExtensionStatus = () => {
    // Get extension token from localStorage
    const token = localStorage.getItem('linkogenei_token');
    if (token) {
      setExtensionToken(token);
      // Extension is considered "active" if token exists
      // User still needs to activate it in the Chrome extension popup
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get extension token from localStorage
      const token = localStorage.getItem('linkogenei_token');
      if (token) {
        setExtensionToken(token);
        
        // Load posts, categories, and stats
        await Promise.all([
          loadPosts(token),
          loadCategories(token),
          loadStats(token)
        ]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (token) => {
    try {
      const response = await fetch(`http://localhost:5001/api/linkogenei/posts?category=${selectedCategory}&platform=${selectedPlatform}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const loadCategories = async (token) => {
    try {
      const response = await fetch('http://localhost:5001/api/linkogenei/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadStats = async (token) => {
    try {
      const response = await fetch('http://localhost:5001/api/linkogenei/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const generateToken = async () => {
    try {
      console.log('Generating token...');
      
      // Check if user is logged in
      if (!currentUser) {
        alert('Please log in first to generate a token.');
        return;
      }
      
      const response = await ApiService.generateLinkoGeneiToken();
      
      console.log('Token response:', response);
      
      if (response.success) {
        setExtensionToken(response.token);
        localStorage.setItem('linkogenei_token', response.token);
        setShowToken(true);
        
        // Show success message
        alert('Token generated successfully! Copy it and paste it in the Chrome extension popup.');
      } else {
        console.error('Token generation failed:', response);
        const errorMsg = response.error || 'Failed to generate token. Please make sure you are logged in.';
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Failed to generate token:', error);
      
      // Check if it's an authentication error
      if (error.message && error.message.includes('401')) {
        alert('Authentication required. Please log in again.');
      } else if (error.message && error.message.includes('token')) {
        alert('Session expired. Please log in again.');
      } else {
        alert(`Failed to generate token: ${error.message || 'Please try again.'}`);
      }
    }
  };

  const regenerateToken = async () => {
    if (!confirm('Are you sure you want to generate a new token? Your old token will stop working and you\'ll need to update the extension.')) {
      return;
    }
    
    // Clear old token
    setExtensionToken('');
    localStorage.removeItem('linkogenei_token');
    setShowToken(false);
    
    // Generate new token
    await generateToken();
  };

  const revokeToken = () => {
    if (!confirm('Are you sure you want to revoke your token? You\'ll need to generate a new one to use the extension.')) {
      return;
    }
    
    setExtensionToken('');
    localStorage.removeItem('linkogenei_token');
    setShowToken(false);
    alert('Token revoked successfully. Generate a new token when you\'re ready to use the extension again.');
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('http://localhost:5001/api/linkogenei/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${extensionToken}`
        },
        body: JSON.stringify({ name: newCategoryName })
      });

      const data = await response.json();
      if (data.success) {
        setCategories([...categories, data.category]);
        setNewCategoryName('');
        setShowNewCategory(false);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const updatePost = async (postId, updates) => {
    try {
      const response = await fetch(`http://localhost:5001/api/linkogenei/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${extensionToken}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (data.success) {
        loadData();
        setEditingPost(null);
      }
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/linkogenei/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${extensionToken}`
        }
      });

      const data = await response.json();
      if (data.success) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(extensionToken);
    alert('Token copied to clipboard!');
  };

  const platforms = ['Instagram', 'LinkedIn', 'Twitter', 'X (Twitter)', 'Facebook'];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <ParticlesBackground />
      <FloatingEmojis />
      <Header />
      
      <main className="flex-grow pt-20 pb-12 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-black via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-500 bg-clip-text text-transparent mb-2">
              🔗 LinkoGenei
            </h1>
            <p className="text-gray-700 dark:text-gray-300">
              Save and organize posts from social media with our Chrome extension
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Posts</p>
                  <p className="text-3xl font-bold text-black dark:text-white">{stats.total_posts}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📌</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Categories</p>
                  <p className="text-3xl font-bold text-black dark:text-white">{stats.total_categories}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📁</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Extension Status</p>
                  <p className="text-lg font-semibold text-black dark:text-green-400">
                    {extensionToken ? '✅ Token Generated' : '⚠️ No Token'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {extensionToken ? 'Activate in Chrome extension' : 'Generate token to start'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔌</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extension Setup */}
          {!extensionToken && (
            <div className="bg-gradient-to-r from-black via-gray-800 to-gray-600 dark:from-white dark:via-gray-200 dark:to-gray-400 rounded-xl shadow-lg p-8 mb-8 text-white dark:text-black transition-all duration-300">
              <h2 className="text-2xl font-bold mb-4">🚀 Get Started with LinkoGenei</h2>
              <p className="mb-6 opacity-90">
                Generate your access token and install our Chrome extension to start saving posts from social media.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={generateToken}
                  className="bg-white dark:bg-black text-black dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-300 shadow-lg"
                >
                  Generate Access Token
                </button>
                <a
                  href="chrome://extensions"
                  className="bg-gray-800 dark:bg-gray-200 text-white dark:text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-all duration-300 text-center shadow-lg"
                >
                  Open Chrome Extensions
                </a>
              </div>
            </div>
          )}

          {/* Token Display */}
          {extensionToken && (
            <div className="bg-gray-50 dark:bg-blue-900/20 border-2 border-gray-300 dark:border-blue-600 rounded-xl p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-blue-200 mb-2">
                    🔑 Your Access Token
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-blue-300">
                    Copy this token and paste it in the Chrome extension popup to activate it.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={regenerateToken}
                    className="text-sm bg-black dark:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-blue-700 transition"
                    title="Generate a new token (old token will stop working)"
                  >
                    🔄 Regenerate
                  </button>
                  <button
                    onClick={revokeToken}
                    className="text-sm bg-gray-600 dark:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 dark:hover:bg-red-700 transition"
                    title="Revoke this token"
                  >
                    🗑️ Revoke
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type={showToken ? "text" : "password"}
                  value={extensionToken}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-blue-600 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="bg-gray-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 dark:hover:bg-blue-600 transition"
                  title={showToken ? "Hide token" : "Show token"}
                >
                  {showToken ? '👁️' : '👁️‍🗨️'}
                </button>
                <button
                  onClick={copyToken}
                  className="bg-black dark:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-blue-600 transition"
                >
                  Copy
                </button>
              </div>
              
              <div className="mt-4 p-4 bg-gray-100 dark:bg-blue-900/40 rounded-lg">
                <p className="text-sm font-semibold text-black dark:text-blue-200 mb-2">
                  📋 How to activate the extension:
                </p>
                <ol className="text-sm text-gray-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Click the LinkoGenei extension icon in Chrome</li>
                  <li>Paste this token in the input field</li>
                  <li>Click "Activate Extension"</li>
                  <li>Badge will turn green when active</li>
                  <li>Visit Instagram, LinkedIn, or Twitter to start saving posts!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name} ({cat.post_count})</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Platforms</option>
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setShowNewCategory(true)}
                  className="bg-black dark:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-purple-700 transition w-full md:w-auto"
                >
                  + New Category
                </button>
              </div>
            </div>
          </div>

          {/* New Category Modal */}
          {showNewCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Category</h3>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name (e.g., Coding, Vlogging)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button
                    onClick={createCategory}
                    className="flex-1 bg-black dark:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-purple-700 transition"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewCategory(false);
                      setNewCategoryName('');
                    }}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Posts Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
              <span className="text-6xl mb-4 block">📭</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No posts saved yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Install the Chrome extension and start saving posts from social media!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
                  {/* Post Image or Placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-black to-gray-700 dark:from-purple-500 dark:to-blue-600 overflow-hidden flex items-center justify-center">
                    {post.image_url ? (
                      <img 
                        src={post.image_url} 
                        alt={post.title || 'Post image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If image fails, show placeholder
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center text-white">
                              <div class="text-center">
                                <div class="text-6xl mb-2">${post.platform === 'Instagram' ? '📷' : post.platform === 'LinkedIn' ? '💼' : post.platform === 'Twitter' || post.platform === 'X (Twitter)' ? '🐦' : '📱'}</div>
                                <div class="text-sm font-semibold">${post.platform}</div>
                              </div>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <div className="text-6xl mb-2">
                            {post.platform === 'Instagram' ? '📷' : 
                             post.platform === 'LinkedIn' ? '💼' : 
                             post.platform === 'Twitter' || post.platform === 'X (Twitter)' ? '🐦' :
                             post.platform === 'YouTube' ? '📺' : '📱'}
                          </div>
                          <div className="text-sm font-semibold">{post.platform}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-purple-900 text-black dark:text-purple-300 rounded-full text-sm font-semibold">
                        {post.platform}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingPost(post)}
                          className="text-black hover:text-gray-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-gray-700 hover:text-black dark:text-red-400 dark:hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">
                      {post.title || 'Untitled Post'}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Category: {post.category}
                    </p>

                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-black hover:text-gray-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold text-sm"
                    >
                      View Original Post →
                    </a>

                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                      Saved {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Post Modal */}
          {editingPost && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Post</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                  <select
                    value={editingPost.category}
                    onChange={(e) => setEditingPost({...editingPost, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Notes</label>
                  <textarea
                    value={editingPost.notes || ''}
                    onChange={(e) => setEditingPost({...editingPost, notes: e.target.value})}
                    placeholder="Add notes about this post..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updatePost(editingPost.id, { category: editingPost.category, notes: editingPost.notes })}
                    className="flex-1 bg-black dark:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-purple-700 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingPost(null)}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
