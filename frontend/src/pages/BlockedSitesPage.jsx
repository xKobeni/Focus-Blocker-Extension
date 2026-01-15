import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useBlockedSiteStore, useUIStore } from '../stores';
import { ArrowLeft, Shield, Plus, Trash2, CheckCircle } from 'lucide-react';

function BlockedSitesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    blockedSites, 
    isLoading: loading, 
    fetchBlockedSites, 
    addBlockedSite, 
    deleteBlockedSite 
  } = useBlockedSiteStore();
  const { setSuccessMessage, setErrorMessage } = useUIStore();
  
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [newSiteCategory, setNewSiteCategory] = useState('custom');

  useEffect(() => {
    if (user?._id) {
      fetchBlockedSites(user._id);
    }
  }, [user]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
  };

  const showError = (message) => {
    setErrorMessage(message);
  };

  const handleAddBlockedSite = async (e) => {
    e.preventDefault();
    if (!user?._id || !newSiteUrl.trim()) return;
    
    const alreadyBlocked = blockedSites.some(s => 
      s.url.includes(newSiteUrl.trim()) || newSiteUrl.trim().includes(s.url)
    );
    
    if (alreadyBlocked) {
      showError('This site is already blocked');
      return;
    }
    
    try {
      await addBlockedSite(user._id, {
        url: newSiteUrl.trim(),
        category: newSiteCategory,
        isActive: true,
      });
      
      setNewSiteUrl('');
      setNewSiteCategory('custom');
      showSuccess('Site blocked successfully!');
      
      // Notify extension to sync
      const { notifyExtensionSync } = await import('../services/extensionService');
      notifyExtensionSync('blockedSites');
    } catch (err) {
      showError(err.message || 'Failed to add blocked site');
    }
  };

  const handleRemoveBlockedSite = async (siteId) => {
    try {
      await deleteBlockedSite(siteId);
      showSuccess('Site unblocked successfully!');
      
      // Notify extension to sync
      const { notifyExtensionSync } = await import('../services/extensionService');
      notifyExtensionSync('blockedSites');
    } catch (err) {
      showError(err.message || 'Failed to remove blocked site');
    }
  };

  const handleBlockCategory = async (category, sites) => {
    setLoading(true);
    try {
      for (const site of sites) {
        if (!blockedSites.some(bs => bs.url.includes(site) || site.includes(bs.url))) {
          await createBlockedSite({
            userId: user._id,
            url: site,
            category: category,
            isActive: true,
          });
        }
      }
      await loadBlockedSites();
      showSuccess(`All ${category} sites blocked successfully!`);
      
      // Notify extension to sync
      const { notifyExtensionSync } = await import('../services/extensionService');
      notifyExtensionSync('blockedSites');
    } catch (err) {
      showError(err.message || 'Failed to block category');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockCategory = async (sites) => {
    setLoading(true);
    try {
      const toRemove = blockedSites.filter(bs => 
        sites.some(site => bs.url.includes(site) || site.includes(bs.url))
      );
      for (const site of toRemove) {
        await deleteBlockedSite(site._id);
      }
      await loadBlockedSites();
      showSuccess('Category unblocked successfully!');
      
      // Notify extension to sync
      const { notifyExtensionSync } = await import('../services/extensionService');
      notifyExtensionSync('blockedSites');
    } catch (err) {
      showError(err.message || 'Failed to unblock category');
    } finally {
      setLoading(false);
    }
  };

  const categorySites = {
    social: ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'linkedin.com', 'pinterest.com', 'snapchat.com', 'discord.com', 'web.whatsapp.com', 'web.telegram.org'],
    video: ['youtube.com', 'netflix.com', 'vimeo.com', 'dailymotion.com'],
    gaming: ['twitch.tv', 'steamcommunity.com', 'epicgames.com'],
    news: ['cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com'],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield size={32} className="text-emerald-500" />
            Blocked Sites
          </h1>
          <p className="text-slate-400">
            Manage your blocked sites list. No limit to the sites and apps you can block.
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-emerald-900/30 border border-emerald-700 rounded-lg text-emerald-300">
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
          {/* Popular Sites - Quick Add */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span>⚡</span>
              Quick Add Popular Sites
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { name: 'Facebook', url: 'facebook.com', icon: '👤', category: 'social', color: 'bg-blue-600' },
                { name: 'Instagram', url: 'instagram.com', icon: '📷', category: 'social', color: 'bg-pink-600' },
                { name: 'Twitter/X', url: 'twitter.com', icon: '🐦', category: 'social', color: 'bg-sky-600' },
                { name: 'TikTok', url: 'tiktok.com', icon: '🎵', category: 'social', color: 'bg-purple-600' },
                { name: 'YouTube', url: 'youtube.com', icon: '▶️', category: 'video', color: 'bg-red-600' },
                { name: 'Netflix', url: 'netflix.com', icon: '🎬', category: 'video', color: 'bg-red-700' },
                { name: 'Twitch', url: 'twitch.tv', icon: '🎮', category: 'gaming', color: 'bg-purple-700' },
                { name: 'Reddit', url: 'reddit.com', icon: '🤖', category: 'social', color: 'bg-orange-600' },
                { name: 'LinkedIn', url: 'linkedin.com', icon: '💼', category: 'social', color: 'bg-blue-700' },
                { name: 'Pinterest', url: 'pinterest.com', icon: '📌', category: 'social', color: 'bg-red-500' },
                { name: 'Snapchat', url: 'snapchat.com', icon: '👻', category: 'social', color: 'bg-yellow-500' },
                { name: 'Discord', url: 'discord.com', icon: '💬', category: 'social', color: 'bg-indigo-600' },
                { name: 'WhatsApp', url: 'web.whatsapp.com', icon: '💚', category: 'social', color: 'bg-green-600' },
                { name: 'Telegram', url: 'web.telegram.org', icon: '✈️', category: 'social', color: 'bg-blue-500' },
                { name: 'CNN', url: 'cnn.com', icon: '📰', category: 'news', color: 'bg-red-800' },
                { name: 'BBC News', url: 'bbc.com', icon: '📡', category: 'news', color: 'bg-slate-700' },
              ].map((site) => {
                const isBlocked = blockedSites.some(s => s.url.includes(site.url) || site.url.includes(s.url));
                return (
                  <button
                    key={site.url}
                    onClick={() => {
                      if (isBlocked) {
                        const siteToRemove = blockedSites.find(s => s.url.includes(site.url) || site.url.includes(s.url));
                        if (siteToRemove) {
                          handleRemoveBlockedSite(siteToRemove._id);
                        }
                      } else {
                        setNewSiteUrl(site.url);
                        setNewSiteCategory(site.category);
                        handleAddBlockedSite(new Event('submit'));
                      }
                    }}
                    disabled={loading}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      isBlocked 
                        ? 'border-emerald-500 bg-emerald-900/30' 
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full ${site.color} flex items-center justify-center text-2xl`}>
                        {site.icon}
                      </div>
                      <span className="text-xs font-medium text-center">{site.name}</span>
                      {isBlocked && (
                        <span className="absolute top-1 right-1 text-emerald-500 text-xs">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              💡 Click on a site to quickly block/unblock it
            </p>
          </div>
          
          {/* Block by Category */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span>⚡</span>
              Block by Category
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Use a category to block everything you need to block with one click
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { category: 'social', label: 'Social Media', icon: '👤', color: 'bg-blue-600' },
                { category: 'video', label: 'Video', icon: '▶️', color: 'bg-red-600' },
                { category: 'gaming', label: 'Gaming', icon: '🎮', color: 'bg-purple-600' },
                { category: 'news', label: 'News', icon: '📰', color: 'bg-orange-600' },
              ].map((cat) => {
                const sites = categorySites[cat.category] || [];
                const blockedCount = sites.filter(site => 
                  blockedSites.some(bs => bs.url.includes(site) || site.includes(bs.url))
                ).length;
                const allBlocked = blockedCount === sites.length && sites.length > 0;
                
                return (
                  <button
                    key={cat.category}
                    onClick={async () => {
                      if (allBlocked) {
                        await handleUnblockCategory(sites);
                      } else {
                        await handleBlockCategory(cat.category, sites);
                      }
                    }}
                    disabled={loading}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      allBlocked
                        ? 'border-emerald-500 bg-emerald-900/30'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full ${cat.color} flex items-center justify-center text-2xl`}>
                        {cat.icon}
                      </div>
                      <span className="text-xs font-medium text-center">{cat.label}</span>
                      <span className="text-xs text-slate-400">
                        {blockedCount}/{sites.length} blocked
                      </span>
                      {allBlocked && (
                        <span className="absolute top-1 right-1 text-emerald-500 text-xs">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Add Custom Site Form */}
          <form onSubmit={handleAddBlockedSite} className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-sm font-medium mb-3">Add Custom Site</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g., facebook.com or https://twitter.com"
              />
              <select
                value={newSiteCategory}
                onChange={(e) => setNewSiteCategory(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="social">Social Media</option>
                <option value="video">Video</option>
                <option value="gaming">Gaming</option>
                <option value="news">News</option>
                <option value="custom">Custom</option>
              </select>
              <button
                type="submit"
                disabled={loading || !newSiteUrl.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Plus size={16} />
                Add Site
              </button>
            </div>
          </form>

          {/* Blocked Sites List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 mb-3">
              Blocked Sites ({blockedSites.length})
            </h3>
            
            {blockedSites.length > 0 ? (
              blockedSites.map(site => (
                <div
                  key={site._id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{site.url}</div>
                    <div className="text-xs text-slate-400 capitalize">{site.category}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveBlockedSite(site._id)}
                    disabled={loading}
                    className="p-2 rounded-md text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Remove site"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Shield size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No blocked sites yet</p>
                <p className="text-xs mt-1">Add websites you want to block during focus sessions</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default BlockedSitesPage;
