import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    image,
    url = typeof window !== 'undefined' ? window.location.href : '',
    type = 'website'
}) => {
    const siteName = 'Amagriya Gorden';
    const defaultTitle = 'Amagriya Gorden - Pusat Gorden Berkualitas';
    const defaultDescription = 'Pusat gorden berkualitas dengan harga terjangkau. Melayani pembuatan gorden custom, survey gratis, dan pemasangan profesional.';
    const defaultImage = '/logo.png'; // Make sure you have a default og:image

    const finalTitle = title ? `${title} | ${siteName}` : defaultTitle;
    const finalDescription = description || defaultDescription;
    const finalImage = image || defaultImage;

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            {keywords && <meta name="keywords" content={keywords} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={finalImage} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
            <meta name="twitter:image" content={finalImage} />
        </Helmet>
    );
};
