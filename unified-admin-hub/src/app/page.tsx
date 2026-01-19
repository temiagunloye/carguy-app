'use client';

import { ActivityLog, AdminLink, createAdminLink, deleteAdminLink, getAdminLinks, getRecentActivity } from '@/services/AdminService';
import { Activity, ExternalLink, Layers, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [links, setLinks] = useState<AdminLink[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // State for Add Link Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLink, setNewLink] = useState<Partial<AdminLink>>({ platform: 'Unified', category: 'other' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [linksData, activityData] = await Promise.all([
        getAdminLinks(),
        getRecentActivity()
      ]);
      setLinks(linksData);
      setActivity(activityData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateLink = async () => {
    if (!newLink.label || !newLink.url) return;
    try {
      await createAdminLink(newLink as Omit<AdminLink, 'id'>);
      // Optimistic update or reload
      await loadData();
      setIsAddModalOpen(false);
      setNewLink({ platform: 'Unified', category: 'other' });
    } catch (e) {
      console.error(e);
      alert('Failed to create link');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    try {
      await deleteAdminLink(id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  }

  // Quick Stats Mock (Will be real later)
  const stats = [
    { label: 'Total Signups', value: '1,248', change: '+12%', icon: Activity },
    { label: 'Active Apps', value: '3', change: 'Stable', icon: Layers },
    { label: 'Pending Updates', value: '1', change: 'Action', icon: RefreshCw },
  ];

  if (loading) return <div className="p-8 text-zinc-500">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      {/* Add Link Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Quick Link</h3>
            <div className="space-y-3">
              <input
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600 transition-colors"
                placeholder="Label (e.g. Analytics)"
                value={newLink.label || ''}
                onChange={e => setNewLink({ ...newLink, label: e.target.value })}
              />
              <input
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600 transition-colors"
                placeholder="URL (https://...)"
                value={newLink.url || ''}
                onChange={e => setNewLink({ ...newLink, url: e.target.value })}
              />
              <div className="flex gap-2">
                <select
                  className="bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600 flex-1"
                  value={newLink.category}
                  onChange={e => setNewLink({ ...newLink, category: e.target.value as any })}
                >
                  <option value="studio">Studio Hub</option>
                  <option value="product">Product App</option>
                  <option value="tool">Admin Tool</option>
                  <option value="other">Other</option>
                </select>
                <select
                  className="bg-black border border-zinc-800 rounded px-3 py-2 text-white outline-none focus:border-red-600 flex-1"
                  value={newLink.platform}
                  onChange={e => setNewLink({ ...newLink, platform: e.target.value as any })}
                >
                  <option value="Unified">Unified</option>
                  <option value="GarageManager">GarageManager</option>
                  <option value="ThatAppCompany">ThatAppCompany</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={handleCreateLink} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">Create Link</button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <p className="text-zinc-500">Welcome back to the command center.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-900 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              <p className="text-xs text-red-400 mt-2">{stat.change}</p>
            </div>
            <div className="p-3 bg-zinc-800 rounded-lg text-zinc-400">
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Links */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Quick Access</h3>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-sm text-zinc-400 hover:text-white flex items-center gap-2"
            >
              <Plus size={16} /> Add Link
            </button>
          </div>

          {links.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-900 border-dashed rounded-xl p-8 text-center text-zinc-500">
              No links configured yet. Add one to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {links.map(link => (
                <div
                  key={link.id}
                  className="bg-zinc-900 border border-zinc-900 hover:border-red-900/50 p-4 rounded-lg flex items-center gap-4 transition-all hover:bg-zinc-900/80 group relative"
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0"></a>
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-red-500 transition-colors z-10 pointer-events-none">
                    <ExternalLink size={20} />
                  </div>
                  <div className="flex-1 z-10 pointer-events-none">
                    <h4 className="font-medium text-white group-hover:text-red-400 transition-colors">{link.label}</h4>
                    <p className="text-xs text-zinc-500 capitalize">{link.category} • {link.platform}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteLink(link.id); }}
                    className="text-zinc-600 hover:text-red-500 z-10 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 min-h-[300px]">
            {activity.length === 0 ? (
              <div className="text-center text-zinc-500 py-8 text-sm">No recent activity logs.</div>
            ) : (
              <div className="space-y-4">
                {activity.map(item => (
                  <div key={item.id} className="flex gap-3 items-start border-b border-zinc-900/50 pb-3 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                    <div>
                      <p className="text-sm text-zinc-300">{item.message}</p>
                      <p className="text-xs text-zinc-600 mt-1">
                        {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
