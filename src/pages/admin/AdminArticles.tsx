import {
  Calendar,
  Edit,
  Eye,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { articlesApi, uploadApi } from '../../utils/api';

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500' },
  PUBLISHED: { label: 'Published', color: 'bg-green-500' },
  ARCHIVED: { label: 'Archived', color: 'bg-red-500' },
  // Frontend legacy mapping
  draft: { label: 'Draft', color: 'bg-gray-500' },
  published: { label: 'Published', color: 'bg-green-500' },
  archived: { label: 'Archived', color: 'bg-red-500' }
};

const categoryOptions = [
  { value: 'tips', label: 'Tips & Tricks' },
  { value: 'trend', label: 'Trend' },
  { value: 'perawatan', label: 'Perawatan' },
  { value: 'inspirasi', label: 'Inspirasi' },
  { value: 'tutorial', label: 'Tutorial' }
];

export default function AdminArticles() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'tips',
    categoryLabel: 'Tips & Tricks',
    author: 'Admin Amagriya',
    publishDate: new Date().toISOString().split('T')[0],
    readTime: '5 menit',
    image: '',
    featured: false,
    status: 'DRAFT',
    tags: [] as string[]
  });

  // Fetch articles
  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesApi.getAll();
      if (response && response.data) {
        setArticles(response.data);
      } else if (Array.isArray(response)) {
        setArticles(response);
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Gagal memuat artikel');
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || article.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    try {
      setUploading(true);
      const response = await uploadApi.uploadFile(file);

      if (response.success) {
        setFormData(prev => ({ ...prev, image: response.data.url }));
        toast.success('Gambar berhasil diupload');
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Gagal upload gambar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenModal = (article?: any) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title,
        slug: article.slug || '',
        excerpt: article.excerpt || '',
        content: article.content || '',
        category: article.category || 'tips',
        categoryLabel: article.categoryLabel || '',
        author: article.author || 'Admin Amagriya',
        publishDate: article.publishDate || new Date().toISOString().split('T')[0], // Assuming backend doesn't send this yet or uses created_at
        readTime: article.readTime || '5 menit',
        image: article.image_url || article.image || '',
        featured: article.is_featured || article.featured || false,
        status: article.status || 'DRAFT',
        tags: article.tags || []
      });
    } else {
      setEditingArticle(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'tips',
        categoryLabel: 'Tips & Tricks',
        author: 'Admin Amagriya',
        publishDate: new Date().toISOString().split('T')[0],
        readTime: '5 menit',
        image: '',
        featured: false,
        status: 'DRAFT',
        tags: []
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.excerpt || !formData.content) {
      toast.error('Mohon isi semua field wajib');
      return;
    }

    if (!formData.image) {
      toast.error('Mohon upload gambar artikel');
      return;
    }

    try {
      setSaving(true);

      // Auto-generate slug if empty
      const slug = formData.slug || formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const payload = {
        title: formData.title,
        slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        author: formData.author,
        image_url: formData.image, // Map to backend
        is_featured: formData.featured, // Map to backend
        status: formData.status,
      };

      if (editingArticle) {
        await articlesApi.update(editingArticle.id, payload);
        toast.success('Artikel berhasil diupdate');
      } else {
        await articlesApi.create(payload);
        toast.success('Artikel berhasil dibuat');
      }

      setShowModal(false);
      fetchArticles();
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast.error('Gagal menyimpan article: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Anda yakin ingin menghapus artikel ini?')) {
      return;
    }

    try {
      await articlesApi.delete(id);
      setArticles(articles.filter(a => a.id !== id));
      toast.success('Artikel berhasil dihapus');
    } catch (error: any) {
      console.error('Error deleting article:', error);
      toast.error('Gagal menghapus artikel: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#EB216A] mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-gray-900">Artikel</h1>
          <p className="text-gray-600 mt-1">Kelola konten artikel dan blog</p>
        </div>
        <Button
          onClick={() => navigate('/admin/articles/new')}
          className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Artikel Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Artikel</p>
              <p className="text-2xl text-gray-900 mt-1">{articles.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl text-gray-900 mt-1">
                {articles.filter(a => a.status === 'PUBLISHED' || a.status === 'published').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl text-gray-900 mt-1">
                {articles.filter(a => a.status === 'DRAFT' || a.status === 'draft').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Edit className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl text-gray-900 mt-1">
                {articles.reduce((sum, a) => sum + (a.view_count || a.views || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul artikel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
          >
            <option value="all">Semua Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Grid View */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-900 mb-1">No Articles Found</p>
              <p className="text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first article to get started'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div key={article.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative aspect-video bg-gray-100">
                {article.image_url || article.image ? (
                  <img
                    src={article.image_url || article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <Badge className={`absolute top-3 right-3 ${statusConfig[article.status as keyof typeof statusConfig]?.color || 'bg-gray-500'} text-white border-0`}>
                  {statusConfig[article.status as keyof typeof statusConfig]?.label || article.status}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Badge className="bg-purple-100 text-purple-700 border-0">
                    {article.category}
                  </Badge>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {article.view_count || article.views || 0}
                  </div>
                </div>

                <h3 className="text-base text-gray-900 line-clamp-2 min-h-[48px]">
                  {article.title}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {article.excerpt}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <Calendar className="w-3 h-3" />
                  {(() => {
                    const dateRaw = article.publishDate || article.createdAt || article.created_at || article.updatedAt || article.updated_at;
                    if (!dateRaw) return '-';
                    const date = new Date(dateRaw);
                    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                  })()}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(article.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#EB216A] to-pink-600">
              <h2 className="text-xl text-white">
                {editingArticle ? 'Edit Artikel' : 'Artikel Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-pink-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Featured Image *
                </label>
                <div className="space-y-3">
                  {formData.image && (
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {formData.image ? 'Change Image' : 'Upload Image'}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Judul Artikel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Slug (URL) - Optional
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="auto-generated-from-title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Ringkasan (Excerpt) *
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Konten Artikel *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                  required
                />
              </div>

              {/* Category & Author */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const selected = categoryOptions.find(c => c.value === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        category: e.target.value,
                        categoryLabel: selected?.label || e.target.value
                      }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                  />
                </div>
              </div>

              {/* Publish Date & Read Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Tanggal Publish
                  </label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Waktu Baca
                  </label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, readTime: e.target.value }))}
                    placeholder="5 menit"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                  />
                </div>
              </div>

              {/* Status & Featured */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="w-4 h-4 text-[#EB216A] border-gray-300 rounded focus:ring-[#EB216A]"
                    />
                    <span className="text-sm text-gray-700">Featured Article</span>
                  </label>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving || uploading}
                  className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save Article</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}