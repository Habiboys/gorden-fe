import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsApi } from '../utils/api';

interface SiteSettings {
    siteName: string;
    siteEmail: string;
    sitePhone: string;
    siteAddress: string;
    whatsappNumber: string;
    instagramUrl: string;
    facebookUrl: string;
    brandColor: string;
    siteLogo: string;
    enableNotifications: boolean;
    enableNewsletter: boolean;
    enableReviews: boolean;
    maintenanceMode: boolean;
}

interface SettingsContextType {
    settings: SiteSettings;
    loading: boolean;
    refreshSettings: () => void;
}

const defaultSettings: SiteSettings = {
    siteName: 'Amagriya Gorden',
    siteEmail: 'info@amagriya.com',
    sitePhone: '081234567890',
    siteAddress: 'Jl. Sudirman No. 123, Jakarta Selatan',
    whatsappNumber: '6281234567890',
    instagramUrl: 'https://instagram.com/amagriya',
    facebookUrl: 'https://facebook.com/amagriya',
    brandColor: '#EB216A',
    siteLogo: '',
    enableNotifications: true,
    enableNewsletter: true,
    enableReviews: true,
    maintenanceMode: false,
};

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    loading: true,
    refreshSettings: () => { },
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const response = await settingsApi.getPublic();
            if (response.success && response.data) {
                setSettings(prev => ({ ...prev, ...response.data }));
            }
        } catch (error) {
            console.error('Error loading public settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Apply brand color as CSS variable whenever it changes
    useEffect(() => {
        if (settings.brandColor) {
            document.documentElement.style.setProperty('--brand-color', settings.brandColor);

            // Also set a darker variant for hover states
            const darkerColor = adjustColor(settings.brandColor, -15);
            document.documentElement.style.setProperty('--brand-color-dark', darkerColor);

            // And a lighter variant for backgrounds
            const lighterColor = adjustColor(settings.brandColor, 90, 0.1);
            document.documentElement.style.setProperty('--brand-color-light', lighterColor);
        }
    }, [settings.brandColor]);

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}

// Helper to darken/lighten a hex color
function adjustColor(hex: string, percent: number, alpha?: number): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Adjust brightness
    r = Math.min(255, Math.max(0, r + (r * percent / 100)));
    g = Math.min(255, Math.max(0, g + (g * percent / 100)));
    b = Math.min(255, Math.max(0, b + (b * percent / 100)));

    if (alpha !== undefined) {
        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
    }

    // Convert back to hex
    const rHex = Math.round(r).toString(16).padStart(2, '0');
    const gHex = Math.round(g).toString(16).padStart(2, '0');
    const bHex = Math.round(b).toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
}

export default SettingsContext;
