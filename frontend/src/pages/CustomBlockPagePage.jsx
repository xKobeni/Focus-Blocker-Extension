import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { getCustomBlockPage, upsertCustomBlockPage } from '../services/customBlockPageService';
import { searchGifs, getTrendingGifs } from '../services/gifSearchService';
import { getRandomQuote } from '../services/quoteService';
import { ArrowLeft, FileText, Save, CheckCircle, Palette, Type, MessageSquare, Quote, Image as ImageIcon, Sparkles, Upload, Search, X, RefreshCw } from 'lucide-react';

function CustomBlockPagePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [blockPageForm, setBlockPageForm] = useState({
    title: 'Site Blocked',
    message: 'This website is on your blocked list during focus sessions.',
    quote: 'Focus is the gateway to thinking clearly, and clear thinking is the gateway to true productivity.',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
    icon: '🚫',
    iconType: 'emoji',
    iconUrl: ''
  });
  const [useGradient, setUseGradient] = useState(true);
  const [solidBackgroundColor, setSolidBackgroundColor] = useState('#667eea');
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [gifSearchLoading, setGifSearchLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    if (user?._id) {
      loadCustomBlockPage();
    }
  }, [user]);

  const loadCustomBlockPage = async () => {
    if (!user?._id) return;
    try {
      const page = await getCustomBlockPage(user._id);
      if (page) {
        const bgColor = page.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        const isGradient = bgColor.includes('gradient');
        setBlockPageForm({
          title: page.title || 'Site Blocked',
          message: page.message || 'This website is on your blocked list during focus sessions.',
          quote: page.quote || 'Focus is the gateway to thinking clearly...',
          backgroundColor: bgColor,
          textColor: page.textColor || '#ffffff',
          icon: page.icon || '🚫',
          iconType: page.iconType || 'emoji',
          iconUrl: page.iconUrl || ''
        });
        setUseGradient(isGradient);
        if (!isGradient) {
          setSolidBackgroundColor(bgColor);
        } else {
          // Extract first color from gradient if possible
          const colorMatch = bgColor.match(/#[0-9a-fA-F]{6}/);
          if (colorMatch) {
            setSolidBackgroundColor(colorMatch[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load custom block page:', err);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setSuccessMessage('');
  };

  const handleSaveCustomBlockPage = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    
    setLoading(true);
    try {
      await upsertCustomBlockPage(user._id, {
        ...blockPageForm,
        isActive: true
      });
      await loadCustomBlockPage();
      showSuccess('Custom block page saved successfully!');
    } catch (err) {
      showError(err.message || 'Failed to save custom block page');
    } finally {
      setLoading(false);
    }
  };

  // Search GIFs using backend API
  const handleGifSearch = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Prevent event from bubbling to parent form
    }
    if (!gifSearchQuery.trim()) {
      setGifResults([]);
      return;
    }

    setGifSearchLoading(true);
    try {
      const results = await searchGifs(gifSearchQuery, 12);
      setGifResults(results);
      setShowGifSearch(true);
    } catch (error) {
      console.error('GIF search error:', error);
      if (error.message.includes('GIPHY_API_KEY')) {
        showError('GIF search requires Giphy API key. Please add GIPHY_API_KEY to your backend .env file. You can still use image URLs manually.');
      } else {
        showError('Failed to search GIFs. You can still use image URLs manually.');
      }
      setGifResults([]);
    } finally {
      setGifSearchLoading(false);
    }
  };

  // Load trending GIFs on mount
  useEffect(() => {
    if (blockPageForm.iconType === 'gif' && gifResults.length === 0 && !gifSearchQuery) {
      loadTrendingGifs();
    }
  }, [blockPageForm.iconType]);

  const loadTrendingGifs = async () => {
    setGifSearchLoading(true);
    try {
      const results = await getTrendingGifs(12);
      setGifResults(results);
      setShowGifSearch(true);
    } catch (error) {
      console.error('Failed to load trending GIFs:', error);
      // Silently fail - user can still use manual URL
    } finally {
      setGifSearchLoading(false);
    }
  };

  // Generate random quote
  const handleGenerateRandomQuote = async () => {
    setQuoteLoading(true);
    try {
      const quoteData = await getRandomQuote();
      setBlockPageForm({ ...blockPageForm, quote: quoteData.quote });
      showSuccess('Random quote generated!');
    } catch (error) {
      console.error('Failed to generate random quote:', error);
      showError('Failed to generate random quote. Please try again.');
    } finally {
      setQuoteLoading(false);
    }
  };

  const selectGif = (gif) => {
    setBlockPageForm({
      ...blockPageForm,
      iconType: 'gif',
      iconUrl: gif.images.fixed_height.url,
      icon: '' // Clear emoji when using GIF
    });
    setShowGifSearch(false);
    setGifSearchQuery('');
  };

  const handleImageUrlChange = (url) => {
    setBlockPageForm({
      ...blockPageForm,
      iconType: url ? 'image' : 'emoji',
      iconUrl: url,
      icon: url ? '' : blockPageForm.icon // Keep emoji if no URL
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-200"
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
              <FileText size={32} className="text-pink-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Custom Block Page
              </h1>
              <p className="text-slate-400 mt-1">
                Create a custom page to redirect and remind yourself of why you need to stay focused.
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-900/40 to-emerald-800/30 border border-emerald-700/50 rounded-xl text-emerald-300 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            <div className="p-1.5 rounded-full bg-emerald-500/20">
              <CheckCircle size={20} className="text-emerald-400" />
            </div>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-gradient-to-r from-red-900/40 to-red-800/30 border border-red-700/50 rounded-xl text-red-300 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            <div className="p-1.5 rounded-full bg-red-500/20">
              <span className="text-red-400 text-xl">⚠️</span>
            </div>
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
            <form onSubmit={handleSaveCustomBlockPage} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Type size={16} className="text-emerald-400" />
                  Title
                </label>
                <input
                  type="text"
                  value={blockPageForm.title}
                  onChange={(e) => setBlockPageForm({ ...blockPageForm, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Enter page title..."
                />
              </div>
              
              {/* Message */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <MessageSquare size={16} className="text-blue-400" />
                  Message
                </label>
                <textarea
                  value={blockPageForm.message}
                  onChange={(e) => setBlockPageForm({ ...blockPageForm, message: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  placeholder="Enter your message..."
                />
              </div>
              
              {/* Quote */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Quote size={16} className="text-purple-400" />
                    Quote
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomQuote}
                    disabled={quoteLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-600/50 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Generate a random motivational quote"
                  >
                    <RefreshCw size={14} className={quoteLoading ? 'animate-spin' : ''} />
                    {quoteLoading ? 'Generating...' : 'Random Quote'}
                  </button>
                </div>
                <textarea
                  value={blockPageForm.quote}
                  onChange={(e) => setBlockPageForm({ ...blockPageForm, quote: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  placeholder="Enter motivational quote or click 'Random Quote' to generate one..."
                />
              </div>
              
              {/* Background Color */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Palette size={16} className="text-pink-400" />
                  Background Color
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <input
                      type="checkbox"
                      id="useGradient"
                      checked={useGradient}
                      onChange={(e) => {
                        setUseGradient(e.target.checked);
                        if (!e.target.checked) {
                          setBlockPageForm({ ...blockPageForm, backgroundColor: solidBackgroundColor });
                        } else {
                          setBlockPageForm({ ...blockPageForm, backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' });
                        }
                      }}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50 cursor-pointer transition-all"
                    />
                    <label htmlFor="useGradient" className="text-sm text-slate-300 cursor-pointer flex items-center gap-2">
                      <Sparkles size={14} className="text-emerald-400" />
                      Use Gradient
                    </label>
                  </div>
                  
                  {useGradient ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-3">Preset Gradients</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { name: 'Purple', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '💜' },
                            { name: 'Blue', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '💙' },
                            { name: 'Pink', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '💗' },
                            { name: 'Green', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', icon: '💚' },
                            { name: 'Orange', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '🧡' },
                            { name: 'Dark', gradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)', icon: '🖤' },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setBlockPageForm({ ...blockPageForm, backgroundColor: preset.gradient })}
                              className="group relative h-16 rounded-xl border-2 transition-all duration-200 overflow-hidden shadow-lg hover:scale-105 hover:shadow-xl"
                              style={{ 
                                borderColor: blockPageForm.backgroundColor === preset.gradient ? '#10b981' : 'rgba(51, 65, 85, 0.5)',
                                background: preset.gradient
                              }}
                              title={preset.name}
                            >
                              {blockPageForm.backgroundColor === preset.gradient && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                  <div className="bg-emerald-500 rounded-full p-1.5 shadow-lg">
                                    <CheckCircle size={16} className="text-white" />
                                  </div>
                                </div>
                              )}
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                {preset.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">Custom Gradient</label>
                        <input
                          type="text"
                          value={blockPageForm.backgroundColor}
                          onChange={(e) => setBlockPageForm({ ...blockPageForm, backgroundColor: e.target.value })}
                          className="w-full rounded-lg border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all font-mono"
                          placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-400">Solid Color</label>
                      <div className="flex gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={solidBackgroundColor}
                            onChange={(e) => {
                              const color = e.target.value;
                              setSolidBackgroundColor(color);
                              setBlockPageForm({ ...blockPageForm, backgroundColor: color });
                            }}
                            className="h-12 w-16 rounded-lg border-2 border-slate-600/50 cursor-pointer shadow-lg hover:scale-105 transition-transform"
                            style={{ backgroundColor: solidBackgroundColor }}
                          />
                        </div>
                        <input
                          type="text"
                          value={solidBackgroundColor}
                          onChange={(e) => {
                            const color = e.target.value;
                            setSolidBackgroundColor(color);
                            setBlockPageForm({ ...blockPageForm, backgroundColor: color });
                          }}
                          className="flex-1 rounded-lg border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all font-mono"
                          placeholder="#667eea"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Type size={16} className="text-cyan-400" />
                  Text Color
                </label>
                <div className="flex gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={blockPageForm.textColor}
                      onChange={(e) => setBlockPageForm({ ...blockPageForm, textColor: e.target.value })}
                      className="h-12 w-16 rounded-lg border-2 border-slate-600/50 cursor-pointer shadow-lg hover:scale-105 transition-transform"
                      style={{ backgroundColor: blockPageForm.textColor }}
                    />
                  </div>
                  <input
                    type="text"
                    value={blockPageForm.textColor}
                    onChange={(e) => setBlockPageForm({ ...blockPageForm, textColor: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              
              {/* Icon */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <ImageIcon size={16} className="text-yellow-400" />
                  Icon
                </label>
                
                {/* Icon Type Selector */}
                <div className="flex gap-2 p-1 rounded-lg bg-slate-800/30 border border-slate-700/50">
                  {[
                    { type: 'emoji', label: 'Emoji', icon: '😀' },
                    { type: 'image', label: 'Image', icon: '🖼️' },
                    { type: 'gif', label: 'GIF', icon: '🎬' }
                  ].map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => {
                        setBlockPageForm({ ...blockPageForm, iconType: option.type });
                        if (option.type === 'emoji' && !blockPageForm.icon) {
                          setBlockPageForm(prev => ({ ...prev, icon: '🚫' }));
                        }
                        setShowGifSearch(false);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        blockPageForm.iconType === option.type
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>

                {/* Emoji Input */}
                {blockPageForm.iconType === 'emoji' && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={blockPageForm.icon}
                        onChange={(e) => setBlockPageForm({ ...blockPageForm, icon: e.target.value, iconUrl: '' })}
                        className="w-full rounded-lg border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-2xl text-center outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                        placeholder="🚫"
                        maxLength={2}
                      />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {['🚫', '⛔', '🔒', '🎯', '💪', '🔥', '⚡', '🌟', '💎', '🎨'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setBlockPageForm({ ...blockPageForm, icon: emoji, iconUrl: '' })}
                          className={`w-12 h-12 rounded-lg border-2 text-2xl flex items-center justify-center transition-all hover:scale-110 ${
                            blockPageForm.icon === emoji
                              ? 'border-yellow-500 bg-yellow-500/20 shadow-lg'
                              : 'border-slate-600/50 bg-slate-800/50 hover:border-yellow-500/50'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image URL Input */}
                {blockPageForm.iconType === 'image' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={blockPageForm.iconUrl}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                        placeholder="https://example.com/image.png"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('image-upload').click()}
                        className="px-4 py-3 rounded-lg border border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-all flex items-center gap-2"
                      >
                        <Upload size={18} />
                      </button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // Convert to data URL for preview
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              handleImageUrlChange(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    {blockPageForm.iconUrl && (
                      <div className="relative rounded-lg border border-slate-600/50 bg-slate-800/50 p-2">
                        <img
                          src={blockPageForm.iconUrl}
                          alt="Icon preview"
                          className="w-full h-32 object-contain rounded"
                          onError={() => showError('Failed to load image. Please check the URL.')}
                        />
                        <button
                          type="button"
                          onClick={() => handleImageUrlChange('')}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* GIF Search */}
                {blockPageForm.iconType === 'gif' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={gifSearchQuery}
                          onChange={(e) => setGifSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleGifSearch(e);
                            }
                          }}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                          placeholder="Search GIFs (e.g., focus, motivation, blocked)..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleGifSearch}
                        disabled={gifSearchLoading || !gifSearchQuery.trim()}
                        className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center gap-2"
                      >
                        <Search size={18} />
                        Search
                      </button>
                    </div>

                    {gifSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setGifSearchQuery('');
                          setGifResults([]);
                          setShowGifSearch(false);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
                      >
                        <X size={12} />
                        Clear search
                      </button>
                    )}

                    {/* Trending GIFs Button */}
                    {!gifSearchQuery && gifResults.length === 0 && (
                      <button
                        type="button"
                        onClick={loadTrendingGifs}
                        disabled={gifSearchLoading}
                        className="w-full px-4 py-2 rounded-lg border border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Sparkles size={16} />
                        {gifSearchLoading ? 'Loading...' : 'Show Trending GIFs'}
                      </button>
                    )}

                    {/* GIF Results */}
                    {gifResults.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-400">
                            {gifSearchQuery ? 'Search Results' : 'Trending GIFs'}
                          </label>
                          <span className="text-xs text-slate-500">{gifResults.length} results</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-600/50 bg-slate-800/30 p-3">
                          <div className="grid grid-cols-2 gap-2">
                            {gifResults.map((gif) => (
                              <button
                                key={gif.id}
                                type="button"
                                onClick={() => selectGif(gif)}
                                className="relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 group"
                                style={{
                                  borderColor: blockPageForm.iconUrl === gif.images.fixed_height.url 
                                    ? '#10b981' 
                                    : 'rgba(51, 65, 85, 0.5)'
                                }}
                              >
                                <img
                                  src={gif.images.fixed_height_small.url}
                                  alt={gif.title || 'GIF'}
                                  className="w-full h-24 object-cover"
                                  loading="lazy"
                                />
                                {blockPageForm.iconUrl === gif.images.fixed_height.url && (
                                  <div className="absolute inset-0 bg-emerald-500/40 flex items-center justify-center backdrop-blur-sm">
                                    <div className="bg-emerald-500 rounded-full p-1 shadow-lg">
                                      <CheckCircle size={18} className="text-white" />
                                    </div>
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-xs text-white truncate">{gif.title || 'GIF'}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manual GIF URL Input */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Or enter GIF URL manually</label>
                      <input
                        type="url"
                        value={blockPageForm.iconUrl}
                        onChange={(e) => setBlockPageForm({ ...blockPageForm, iconUrl: e.target.value })}
                        className="w-full rounded-lg border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                        placeholder="https://example.com/animation.gif"
                      />
                    </div>

                    {/* Selected GIF Preview */}
                    {blockPageForm.iconUrl && blockPageForm.iconType === 'gif' && (
                      <div className="relative rounded-lg border border-slate-600/50 bg-slate-800/50 p-2">
                        <img
                          src={blockPageForm.iconUrl}
                          alt="GIF preview"
                          className="w-full h-32 object-contain rounded"
                          onError={() => showError('Failed to load GIF. Please check the URL.')}
                        />
                        <button
                          type="button"
                          onClick={() => setBlockPageForm({ ...blockPageForm, iconUrl: '' })}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {gifSearchLoading && (
                      <div className="text-center py-4 text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
                        <p className="text-xs mt-2">Searching GIFs...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Save Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-lg hover:shadow-emerald-500/50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Custom Block Page'}
              </button>
            </form>
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <FileText size={20} className="text-emerald-400" />
                Live Preview
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Real-time
              </div>
            </div>
            <div 
              className="rounded-xl p-8 text-center min-h-[500px] flex flex-col items-center justify-center shadow-2xl border-2 border-white/10 relative overflow-hidden"
              style={{ 
                background: blockPageForm.backgroundColor,
                color: blockPageForm.textColor
              }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 rounded-full blur-3xl" style={{ background: blockPageForm.textColor }}></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full blur-3xl" style={{ background: blockPageForm.textColor }}></div>
              </div>
              
              <div className="relative z-10 space-y-6 max-w-md">
                <div className="mb-6 flex justify-center" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
                  {blockPageForm.iconType === 'emoji' ? (
                    <div className="text-7xl animate-bounce">
                      {blockPageForm.icon || '🚫'}
                    </div>
                  ) : blockPageForm.iconUrl ? (
                    <img
                      src={blockPageForm.iconUrl}
                      alt="Icon"
                      className={`max-w-[120px] max-h-[120px] object-contain ${blockPageForm.iconType === 'gif' ? '' : ''}`}
                      style={{ 
                        animation: blockPageForm.iconType === 'gif' ? 'none' : 'none',
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
                      }}
                      onError={() => {
                        // Fallback to emoji if image fails
                        setBlockPageForm({ ...blockPageForm, iconType: 'emoji', icon: '🚫', iconUrl: '' });
                      }}
                    />
                  ) : (
                    <div className="text-7xl animate-bounce">🚫</div>
                  )}
                </div>
                <h2 className="text-4xl font-bold mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {blockPageForm.title || 'Site Blocked'}
                </h2>
                <p className="text-xl mb-8 opacity-95 leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  {blockPageForm.message || 'This website is on your blocked list during focus sessions.'}
                </p>
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 italic border border-white/20 shadow-xl">
                  <Quote size={24} className="mx-auto mb-2 opacity-60" />
                  <p className="text-lg leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                    "{blockPageForm.quote || 'Focus is the gateway to thinking clearly, and clear thinking is the gateway to true productivity.'}"
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/20">
                  <p className="text-sm opacity-80">Stay focused on your goals! 🎯</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <p className="text-xs text-slate-400 text-center">
                💡 This is how your block page will appear to users
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomBlockPagePage;
