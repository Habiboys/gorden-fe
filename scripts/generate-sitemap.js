/**
 * Sitemap Generator Script
 * Run this script after build to generate sitemap.xml
 * 
 * Usage: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.VITE_SITE_URL || 'https://amagriya.com';
const API_URL = process.env.VITE_API_BASE_URL || 'https://api.amagriya.com/api/v1';

// Static pages
const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/products', priority: 0.9, changefreq: 'daily' },
    { url: '/calculator', priority: 0.8, changefreq: 'weekly' },
    { url: '/gallery', priority: 0.7, changefreq: 'weekly' },
    { url: '/articles', priority: 0.7, changefreq: 'weekly' },
    { url: '/services', priority: 0.6, changefreq: 'monthly' },
    { url: '/contact', priority: 0.5, changefreq: 'monthly' },
    { url: '/about', priority: 0.5, changefreq: 'monthly' },
    { url: '/faq', priority: 0.5, changefreq: 'monthly' },
];

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products?limit=1000`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function fetchArticles() {
    try {
        const response = await fetch(`${API_URL}/articles?status=PUBLISHED`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

function generateSitemapXML(urls) {
    const today = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(item => {
        xml += '  <url>\n';
        xml += `    <loc>${SITE_URL}${item.url}</loc>\n`;
        xml += `    <lastmod>${item.lastmod || today}</lastmod>\n`;
        xml += `    <changefreq>${item.changefreq || 'weekly'}</changefreq>\n`;
        xml += `    <priority>${item.priority || 0.5}</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
}

async function generateSitemap() {
    console.log('🔄 Generating sitemap...');

    const allUrls = [...staticPages];

    // Fetch dynamic data
    console.log('📦 Fetching products...');
    const products = await fetchProducts();
    products.forEach(product => {
        if (product.slug && product.status === 'ACTIVE') {
            allUrls.push({
                url: `/products/${product.slug}`,
                priority: 0.8,
                changefreq: 'weekly',
                lastmod: product.updatedAt?.split('T')[0]
            });
        }
    });
    console.log(`   Found ${products.length} products`);

    console.log('📰 Fetching articles...');
    const articles = await fetchArticles();
    articles.forEach(article => {
        if (article.slug) {
            allUrls.push({
                url: `/articles/${article.slug}`,
                priority: 0.7,
                changefreq: 'weekly',
                lastmod: article.updatedAt?.split('T')[0]
            });
        }
    });
    console.log(`   Found ${articles.length} articles`);

    console.log('📂 Fetching categories...');
    const categories = await fetchCategories();
    categories.forEach(category => {
        if (category.id) {
            allUrls.push({
                url: `/products?categoryId=${category.id}`,
                priority: 0.7,
                changefreq: 'weekly'
            });
        }
    });
    console.log(`   Found ${categories.length} categories`);

    // Generate XML
    const sitemapXml = generateSitemapXML(allUrls);

    // Write to public folder
    const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(outputPath, sitemapXml);

    console.log(`✅ Sitemap generated with ${allUrls.length} URLs`);
    console.log(`📄 Output: ${outputPath}`);
}

generateSitemap().catch(console.error);
