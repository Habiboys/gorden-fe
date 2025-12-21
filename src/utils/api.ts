const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apigorden.oblixpilates.com/api/v1';

// Helper function to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get token from localStorage
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || `API Error: ${response.status}`);
        }

        return data;
    } catch (error: any) {
        console.error(`API Call Error [${endpoint}]:`, error);
        throw error;
    }
}

// Auth API
export const authApi = {
    login: (credentials: any) => apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),
    register: (userData: any) => apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
    me: () => apiCall('/auth/me'),
    verifyEmail: (token: string) => apiCall(`/auth/verify-email/${token}`),
    resendVerification: (email: string) => apiCall('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }),
    changePassword: (data: { currentPassword: string; newPassword: string }) => apiCall('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
};

// Products API
export const productsApi = {
    getAll: (params?: { category?: string; featured?: boolean; limit?: number }) => {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.append('category', params.category);
        if (params?.featured) queryParams.append('featured', 'true');
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const query = queryParams.toString();
        return apiCall(`/products${query ? `?${query}` : ''}`);
    },

    getProducts: () => apiCall('/products'),

    getById: (id: string) => apiCall(`/products/${id}`),

    create: (product: any) => apiCall('/products', {
        method: 'POST',
        body: JSON.stringify(product),
    }),

    update: (id: string, product: any) => apiCall(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
    }),

    delete: (id: string) => apiCall(`/products/${id}`, {
        method: 'DELETE',
    }),

    incrementView: (id: string) => apiCall(`/products/${id}/view`, {
        method: 'POST',
    }),
};

// Categories API
export const categoriesApi = {
    getAll: () => apiCall('/categories'),

    getCategories: () => apiCall('/categories'),

    getById: (id: string) => apiCall(`/categories/${id}`),

    create: (category: any) => apiCall('/categories', {
        method: 'POST',
        body: JSON.stringify(category),
    }),

    update: (id: string, category: any) => apiCall(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(category),
    }),

    delete: (id: string) => apiCall(`/categories/${id}`, {
        method: 'DELETE',
    }),
};

// Articles API
export const articlesApi = {
    getAll: (params?: { category?: string; featured?: boolean; limit?: number; search?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.append('category', params.category);
        if (params?.featured) queryParams.append('featured', 'true');
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const query = queryParams.toString();
        return apiCall(`/articles${query ? `?${query}` : ''}`);
    },

    getBySlug: (slug: string) => apiCall(`/articles/${slug}`),

    create: (article: any) => apiCall('/articles', {
        method: 'POST',
        body: JSON.stringify(article),
    }),

    update: (id: string, article: any) => apiCall(`/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(article),
    }),

    delete: (id: string) => apiCall(`/articles/${id}`, {
        method: 'DELETE',
    }),

    incrementView: (id: string) => apiCall(`/articles/${id}/view`, {
        method: 'POST',
    }),
};

// Calculator Leads API
export const calculatorLeadsApi = {
    getAll: (params?: { status?: string; type?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.type) queryParams.append('type', params.type);

        const query = queryParams.toString();
        return apiCall(`/calculator-leads${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => apiCall(`/calculator-leads/${id}`),

    submit: (lead: any) => apiCall('/calculator-leads', {
        method: 'POST',
        body: JSON.stringify(lead),
    }),

    updateStatus: (id: string, status: string) => apiCall(`/calculator-leads/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    }),

    delete: (id: string) => apiCall(`/calculator-leads/${id}`, {
        method: 'DELETE',
    }),
};

// Documents API (Quotations & Invoices)
export const documentsApi = {
    getAll: (params?: { type?: string; status?: string; search?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.type) queryParams.append('type', params.type);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.search) queryParams.append('search', params.search);

        const query = queryParams.toString();
        return apiCall(`/documents${query ? `?${query}` : ''}`);
    },

    getOne: (id: string) => apiCall(`/documents/${id}`),

    create: (document: any) => apiCall('/documents', {
        method: 'POST',
        body: JSON.stringify(document),
    }),

    update: (id: string, document: any) => apiCall(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(document),
    }),

    updateStatus: (id: string, status: string) => apiCall(`/documents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }),

    delete: (id: string) => apiCall(`/documents/${id}`, {
        method: 'DELETE',
    }),

    // Generate and download PDF
    downloadPDF: async (id: string, filename?: string) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/documents/${id}/pdf`, {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return { success: true };
    },

    // Send document via email
    sendEmail: (id: string) => apiCall(`/documents/${id}/send`, {
        method: 'POST',
    }),
};

// Referrals API
export const referralsApi = {
    getAll: (params?: { status?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);

        const query = queryParams.toString();
        return apiCall(`/referrals${query ? `?${query}` : ''}`);
    },

    getByCode: (code: string) => apiCall(`/referrals/code/${code}`),

    register: (referral: any) => apiCall('/referrals/register', {
        method: 'POST',
        body: JSON.stringify(referral),
    }),

    submit: (data: any) => apiCall('/referrals/submit', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    approve: (id: string, customerId: string) => apiCall(`/referrals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ customerId }),
    }),

    updateStatus: (id: string, status: string) => apiCall(`/referrals/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    }),

    // User's own stats
    getMyStats: () => apiCall('/referrals/stats'),

    // Admin endpoints
    getAllReferrers: (search?: string) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        const query = params.toString() ? `?${params.toString()}` : '';
        return apiCall(`/referrals/admin${query}`);
    },

    getAdminStats: () => apiCall('/referrals/admin/stats'),

    getReferrerDetail: (id: string) => apiCall(`/referrals/admin/${id}`),

    payCommission: (id: string) => apiCall(`/referrals/${id}/pay`, {
        method: 'PATCH',
    }),

    payAllCommissions: (referrerId: string) => apiCall(`/referrals/admin/${referrerId}/pay-all`, {
        method: 'PATCH',
    }),
};

// Orders API
export const ordersApi = {
    getAll: (params?: { status?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);

        const query = queryParams.toString();
        return apiCall(`/orders${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => apiCall(`/orders/${id}`),

    create: (order: any) => apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
    }),

    updateStatus: (id: string, status: string) => apiCall(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    }),

    updatePaymentStatus: (id: string, paymentStatus: string) => apiCall(`/orders/${id}/payment`, {
        method: 'PUT',
        body: JSON.stringify({ paymentStatus }),
    }),

    delete: (id: string) => apiCall(`/orders/${id}`, {
        method: 'DELETE',
    }),
};

// Dashboard API
export const dashboardApi = {
    getStats: () => apiCall('/dashboard/stats'),
};

// Services API
export const servicesApi = {
    getAll: () => apiCall('/services'),

    getById: (id: string) => apiCall(`/services/${id}`),

    create: (service: any) => apiCall('/services', {
        method: 'POST',
        body: JSON.stringify(service),
    }),

    update: (id: string, service: any) => apiCall(`/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(service),
    }),

    delete: (id: string) => apiCall(`/services/${id}`, {
        method: 'DELETE',
    }),
};

// Gallery API
export const galleryApi = {
    getAll: (params?: { category?: string; featured?: boolean }) => {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.append('category', params.category);
        if (params?.featured) queryParams.append('featured', 'true');

        const query = queryParams.toString();
        return apiCall(`/gallery${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => apiCall(`/gallery/${id}`),

    create: (galleryItem: any) => apiCall('/gallery', {
        method: 'POST',
        body: JSON.stringify(galleryItem),
    }),

    update: (id: string, galleryItem: any) => apiCall(`/gallery/${id}`, {
        method: 'PUT',
        body: JSON.stringify(galleryItem),
    }),

    delete: (id: string) => apiCall(`/gallery/${id}`, {
        method: 'DELETE',
    }),
};

// FAQs API
export const faqsApi = {
    getAll: (params?: { category?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.append('category', params.category);

        const query = queryParams.toString();
        return apiCall(`/faqs${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => apiCall(`/faqs/${id}`),

    create: (faq: any) => apiCall('/faqs', {
        method: 'POST',
        body: JSON.stringify(faq),
    }),

    update: (id: string, faq: any) => apiCall(`/faqs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(faq),
    }),

    delete: (id: string) => apiCall(`/faqs/${id}`, {
        method: 'DELETE',
    }),
};

// Contacts API
export const contactsApi = {
    getAll: (params?: { status?: string; type?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.type) queryParams.append('type', params.type);

        const query = queryParams.toString();
        return apiCall(`/contacts${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => apiCall(`/contacts/${id}`),

    submit: (contact: any) => apiCall('/contacts', {
        method: 'POST',
        body: JSON.stringify(contact),
    }),

    updateStatus: (id: string, status: string) => apiCall(`/contacts/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    }),

    update: (id: string, contact: any) => apiCall(`/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contact),
    }),

    delete: (id: string) => apiCall(`/contacts/${id}`, {
        method: 'DELETE',
    }),
};

// Upload API
export const uploadApi = {
    // Upload single file
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        // Get token
        const token = localStorage.getItem('token');

        const url = `${API_BASE_URL}/upload/image`; // Updated endpoint path

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || `Upload Error: ${response.status}`);
            }

            return data;
        } catch (error: any) {
            console.error('Upload Error:', error);
            throw error;
        }
    },

    // Upload multiple files
    uploadMultiple: async (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        // Get token
        const token = localStorage.getItem('token');

        const url = `${API_BASE_URL}/upload/multiple`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || `Upload Error: ${response.status}`);
            }

            return data;
        } catch (error: any) {
            console.error('Multiple Upload Error:', error);
            throw error;
        }
    },

    // Delete file
    deleteFile: (path: string) => apiCall(`/upload/${encodeURIComponent(path)}`, {
        method: 'DELETE',
    }),
};

// Calculator Components API
export const calculatorComponentsApi = {
    getAll: () => apiCall('/calculator-components'),

    getGrouped: () => apiCall('/calculator-components/grouped'),

    getByType: (type: string) => apiCall(`/calculator-components/${type}`),

    getById: (id: string) => apiCall(`/calculator-components/detail/${id}`),

    create: (component: any) => apiCall('/calculator-components', {
        method: 'POST',
        body: JSON.stringify(component),
    }),

    update: (id: string, component: any) => apiCall(`/calculator-components/${id}`, {
        method: 'PUT',
        body: JSON.stringify(component),
    }),

    delete: (id: string) => apiCall(`/calculator-components/${id}`, {
        method: 'DELETE',
    }),

    bulkCreate: (components: any[]) => apiCall('/calculator-components/bulk', {
        method: 'POST',
        body: JSON.stringify({ components }),
    }),
};

// Site Settings API
export const settingsApi = {
    getAll: () => apiCall('/settings'),

    getPublic: () => apiCall('/settings/public'),

    updateBulk: (settings: any) => apiCall('/settings/bulk', {
        method: 'PUT',
        body: JSON.stringify(settings),
    }),
};

// Wishlist API
export const wishlistApi = {
    getAll: () => apiCall('/wishlist'),

    getCount: () => apiCall('/wishlist/count'),

    check: (productId: string) => apiCall(`/wishlist/check/${productId}`),

    add: (productId: string) => apiCall('/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
    }),

    remove: (productId: string) => apiCall(`/wishlist/${productId}`, {
        method: 'DELETE',
    }),
};