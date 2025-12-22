import {
    ArrowLeft,
    Bold,
    Image as ImageIcon,
    Italic,
    Link2,
    List,
    ListOrdered,
    Loader2,
    Quote,
    Save,
    Send,
    Underline,
    Upload,
    X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { articlesApi, uploadApi } from '../../utils/api';

const categoryOptions = [
    { value: 'tips', label: 'Tips & Tricks' },
    { value: 'trend', label: 'Trend' },
    { value: 'perawatan', label: 'Perawatan' },
    { value: 'inspirasi', label: 'Inspirasi' },
    { value: 'tutorial', label: 'Tutorial' }
];

export default function AdminArticleEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const contentImageRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'tips',
        author: 'Admin Amagriya',
        image: '',
        featured: false,
        status: 'DRAFT',
        tags: ''
    });

    // Image size modal state
    const [showImageSizeModal, setShowImageSizeModal] = useState(false);
    const [pendingImageUrl, setPendingImageUrl] = useState('');
    const [imageSize, setImageSize] = useState('full'); // small, medium, full, custom
    const [customWidth, setCustomWidth] = useState('');

    // Track if editor has been initialized
    const editorInitialized = useRef(false);

    // Load article data if editing
    useEffect(() => {
        if (id) {
            loadArticle();
        }
    }, [id]);

    // Set initial content in editor (only once after load)
    useEffect(() => {
        if (editorRef.current && formData.content && !editorInitialized.current) {
            editorRef.current.innerHTML = formData.content;
            editorInitialized.current = true;
        }
    }, [formData.content]);

    const loadArticle = async () => {
        try {
            setLoading(true);
            const response = await articlesApi.getById(id!);
            if (response.success && response.data) {
                const article = response.data;
                setFormData({
                    title: article.title || '',
                    slug: article.slug || '',
                    excerpt: article.excerpt || '',
                    content: article.content || '',
                    category: article.category || 'tips',
                    author: article.author || 'Admin Amagriya',
                    image: article.image_url || article.image || '',
                    featured: article.is_featured || false,
                    status: article.status || 'DRAFT',
                    tags: article.tags || ''
                });
                // Content will be set via useEffect
            }
        } catch (error) {
            console.error('Error loading article:', error);
            toast.error('Gagal memuat artikel');
        } finally {
            setLoading(false);
        }
    };

    // Handle featured image upload
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

    // Handle content image upload - shows size dialog first
    const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const response = await uploadApi.uploadFile(file);

            if (response.success) {
                // Show size selection dialog
                setPendingImageUrl(response.data.url);
                setImageSize('full');
                setCustomWidth('');
                setShowImageSizeModal(true);
            }
        } catch (error: any) {
            console.error('Error uploading content image:', error);
            toast.error('Gagal upload gambar');
        } finally {
            setUploading(false);
        }
    };

    // Insert image with selected size
    const insertImageWithSize = () => {
        if (!pendingImageUrl || !editorRef.current) return;

        const img = document.createElement('img');
        img.src = pendingImageUrl;
        img.alt = 'Image';

        // Apply size
        let inlineStyle = '';

        switch (imageSize) {
            case 'small':
                inlineStyle = 'width: 25%; max-width: 200px;';
                break;
            case 'medium':
                inlineStyle = 'width: 50%; max-width: 400px;';
                break;
            case 'full':
                inlineStyle = 'width: 100%;';
                break;
            case 'custom':
                if (customWidth) {
                    inlineStyle = `width: ${customWidth}px; max-width: 100%;`;
                }
                break;
        }

        img.className = 'h-auto rounded-lg my-4';
        img.style.cssText = inlineStyle + ' height: auto; display: block;';

        // Focus editor first
        editorRef.current.focus();

        // Try to insert at cursor, fallback to end
        try {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                // Check if selection is inside editor
                if (editorRef.current.contains(range.commonAncestorContainer)) {
                    range.deleteContents();
                    range.insertNode(img);
                    range.setStartAfter(img);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    // Insert at end
                    editorRef.current.appendChild(document.createElement('br'));
                    editorRef.current.appendChild(img);
                }
            } else {
                // Insert at end
                editorRef.current.appendChild(document.createElement('br'));
                editorRef.current.appendChild(img);
            }
        } catch (e) {
            // Fallback: append to end
            editorRef.current.appendChild(document.createElement('br'));
            editorRef.current.appendChild(img);
        }

        updateContent();
        setShowImageSizeModal(false);
        setPendingImageUrl('');
        toast.success('Gambar ditambahkan ke konten');
    };

    // Update content from editor
    const updateContent = () => {
        if (editorRef.current) {
            setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
        }
    };

    // Save selection before clicking toolbar buttons
    const savedSelection = useRef<Range | null>(null);

    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            savedSelection.current = selection.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        if (savedSelection.current && editorRef.current) {
            editorRef.current.focus();
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(savedSelection.current);
            }
        }
    };

    // Text formatting commands - improved version
    const execCommand = (command: string, value?: string) => {
        // Focus editor first
        if (editorRef.current) {
            editorRef.current.focus();
        }

        // Restore selection
        restoreSelection();

        // For formatBlock, we need to wrap the value in angle brackets
        let finalValue = value;
        if (command === 'formatBlock' && value && !value.startsWith('<')) {
            finalValue = `<${value}>`;
        }

        // Execute command
        const success = document.execCommand(command, false, finalValue);
        console.log(`execCommand(${command}, ${finalValue}): ${success}`);

        // Update content
        updateContent();
    };

    // Insert link
    const insertLink = () => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
        restoreSelection();
        const url = prompt('Masukkan URL:');
        if (url) {
            document.execCommand('createLink', false, url);
            updateContent();
        }
    };

    // Handle form submit
    const handleSubmit = async (status?: string) => {
        if (!formData.title || !formData.excerpt) {
            toast.error('Mohon isi judul dan ringkasan');
            return;
        }

        if (!formData.image) {
            toast.error('Mohon upload featured image');
            return;
        }

        // Get latest content from editor
        const content = editorRef.current?.innerHTML || '';
        if (!content || content === '<br>') {
            toast.error('Mohon isi konten artikel');
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
                content,
                category: formData.category,
                author: formData.author,
                image_url: formData.image,
                is_featured: formData.featured,
                status: status || formData.status
            };

            if (isEditing) {
                await articlesApi.update(id!, payload);
                toast.success('Artikel berhasil diupdate');
            } else {
                await articlesApi.create(payload);
                toast.success('Artikel berhasil dibuat');
            }

            navigate('/admin/articles');
        } catch (error: any) {
            console.error('Error saving article:', error);
            toast.error('Gagal menyimpan artikel: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#EB216A] mx-auto mb-4" />
                    <p className="text-gray-600">Memuat artikel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/admin/articles')}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl font-semibold text-gray-900">
                                {isEditing ? 'Edit Artikel' : 'Artikel Baru'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => handleSubmit('DRAFT')}
                                disabled={saving}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Simpan Draft
                            </Button>
                            <Button
                                onClick={() => handleSubmit('PUBLISHED')}
                                disabled={saving}
                                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )}
                                Publish
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Editor Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Judul Artikel"
                                className="w-full text-3xl font-semibold text-gray-900 border-0 focus:ring-0 focus:outline-none placeholder:text-gray-400"
                            />
                        </div>

                        {/* Excerpt */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ringkasan (Excerpt)
                            </label>
                            <textarea
                                value={formData.excerpt}
                                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                placeholder="Tulis ringkasan singkat artikel..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                            />
                        </div>

                        {/* Content Editor */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
                                    className="p-2 hover:bg-white rounded-lg transition-colors font-bold"
                                    title="Bold (Ctrl+B)"
                                >
                                    <Bold className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
                                    className="p-2 hover:bg-white rounded-lg transition-colors italic"
                                    title="Italic (Ctrl+I)"
                                >
                                    <Italic className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }}
                                    className="p-2 hover:bg-white rounded-lg transition-colors underline"
                                    title="Underline (Ctrl+U)"
                                >
                                    <Underline className="w-4 h-4" />
                                </button>

                                <div className="w-px h-6 bg-gray-300 mx-1" />

                                <select
                                    onMouseDown={saveSelection}
                                    onChange={(e) => {
                                        restoreSelection();
                                        execCommand('formatBlock', e.target.value);
                                        e.target.value = 'p'; // Reset select
                                    }}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none"
                                    title="Format"
                                >
                                    <option value="p">Paragraph</option>
                                    <option value="h2">Heading 2</option>
                                    <option value="h3">Heading 3</option>
                                    <option value="h4">Heading 4</option>
                                </select>

                                <div className="w-px h-6 bg-gray-300 mx-1" />

                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }}
                                    className="p-2 hover:bg-white rounded-lg transition-colors"
                                    title="Bullet List"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execCommand('insertOrderedList'); }}
                                    className="p-2 hover:bg-white rounded-lg transition-colors"
                                    title="Numbered List"
                                >
                                    <ListOrdered className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'blockquote'); }}
                                    className="p-2 hover:bg-white rounded-lg transition-colors"
                                    title="Quote"
                                >
                                    <Quote className="w-4 h-4" />
                                </button>

                                <div className="w-px h-6 bg-gray-300 mx-1" />

                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={insertLink}
                                    className="p-2 hover:bg-white rounded-lg transition-colors"
                                    title="Insert Link"
                                >
                                    <Link2 className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => contentImageRef.current?.click()}
                                    disabled={uploading}
                                    className="p-2 hover:bg-white rounded-lg transition-colors"
                                    title="Insert Image"
                                >
                                    {uploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-4 h-4" />
                                    )}
                                </button>
                                <input
                                    ref={contentImageRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleContentImageUpload}
                                    className="hidden"
                                />
                            </div>

                            {/* Editor Area */}
                            <style>{`
                                .editor-content h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.3; }
                                .editor-content h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; line-height: 1.4; }
                                .editor-content h4 { font-size: 1.125rem; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; }
                                .editor-content p { margin-bottom: 1em; line-height: 1.6; }
                                .editor-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
                                .editor-content ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
                                .editor-content blockquote { border-left: 4px solid #EB216A; padding-left: 1em; margin: 1em 0; font-style: italic; background-color: #FFF5F7; padding-top: 0.5em; padding-bottom: 0.5em; border-radius: 0 0.5em 0.5em 0; }
                                .editor-content a { color: #EB216A; text-decoration: underline; }
                                .editor-content img { max-width: 100%; height: auto; border-radius: 0.5em; margin: 1em 0; }
                                .editor-content strong { font-weight: 700; }
                                .editor-content em { font-style: italic; }
                            `}</style>
                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={updateContent}
                                onMouseUp={saveSelection}
                                onKeyUp={saveSelection}
                                className="editor-content min-h-[500px] p-6 focus:outline-none max-w-none text-gray-700 bg-white"
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Featured Image */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Featured Image</h3>
                            {formData.image ? (
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                                    <img
                                        src={formData.image}
                                        alt="Featured"
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
                            ) : (
                                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                                    <ImageIcon className="w-12 h-12 text-gray-400" />
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
                                variant="outline"
                                className="w-full"
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                )}
                                {formData.image ? 'Ganti Gambar' : 'Upload Gambar'}
                            </Button>
                        </div>

                        {/* Settings */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Pengaturan</h3>

                            {/* Category */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">Kategori</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                                >
                                    {categoryOptions.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tags (Pisahkan dengan koma)
                                </label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="gorden, minimalis, tips"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#EB216A] focus:border-[#EB216A]"
                                />
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">Slug (URL)</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    placeholder="auto-generated"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                                />
                            </div>

                            {/* Author */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">Author</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm text-gray-700 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="PUBLISHED">Published</option>
                                </select>
                            </div>

                            {/* Featured */}
                            <div>
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
                    </div>
                </div>
            </div>

            {/* Image Size Modal */}
            {showImageSizeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#EB216A] to-pink-600 shrink-0">
                            <h2 className="text-lg text-white">Pilih Ukuran Gambar</h2>
                        </div>
                        <div className="p-4 space-y-4 overflow-y-auto flex-1">
                            {/* Image Preview - Limited height */}
                            <div className="bg-gray-100 rounded-lg p-3 flex justify-center max-h-32 overflow-hidden">
                                <img
                                    src={pendingImageUrl}
                                    alt="Preview"
                                    className="max-h-24 max-w-full object-contain rounded"
                                />
                            </div>

                            {/* Size Options */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="imageSize"
                                        value="small"
                                        checked={imageSize === 'small'}
                                        onChange={(e) => setImageSize(e.target.value)}
                                        className="text-[#EB216A] focus:ring-[#EB216A]"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">Kecil (25%)</p>
                                        <p className="text-sm text-gray-500">1/4 lebar konten</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="imageSize"
                                        value="medium"
                                        checked={imageSize === 'medium'}
                                        onChange={(e) => setImageSize(e.target.value)}
                                        className="text-[#EB216A] focus:ring-[#EB216A]"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">Sedang (50%)</p>
                                        <p className="text-sm text-gray-500">Setengah lebar konten</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="imageSize"
                                        value="full"
                                        checked={imageSize === 'full'}
                                        onChange={(e) => setImageSize(e.target.value)}
                                        className="text-[#EB216A] focus:ring-[#EB216A]"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">Penuh (100%)</p>
                                        <p className="text-sm text-gray-500">Selebar konten</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="imageSize"
                                        value="custom"
                                        checked={imageSize === 'custom'}
                                        onChange={(e) => setImageSize(e.target.value)}
                                        className="text-[#EB216A] focus:ring-[#EB216A]"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Custom</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="number"
                                                value={customWidth}
                                                onChange={(e) => setCustomWidth(e.target.value)}
                                                placeholder="Lebar"
                                                className="w-24 px-2 py-1 border rounded text-sm focus:outline-none focus:border-[#EB216A]"
                                                onClick={() => setImageSize('custom')}
                                            />
                                            <span className="text-sm text-gray-500">px</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowImageSizeModal(false);
                                    setPendingImageUrl('');
                                }}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={insertImageWithSize}
                                className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                            >
                                Sisipkan Gambar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
