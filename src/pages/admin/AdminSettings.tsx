import { Loader2, Save, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { settingsApi, uploadApi } from '../../utils/api';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    siteName: 'Amagriya Gorden',
    siteEmail: 'info@amagriya.com',
    sitePhone: '081234567890',
    siteAddress: 'Jl. Sudirman No. 123, Jakarta Selatan',
    whatsappNumber: '6281234567890',
    instagramUrl: 'https://instagram.com/amagriya',
    facebookUrl: 'https://facebook.com/amagriya',
    enableNotifications: true,
    enableNewsletter: true,
    enableReviews: true,
    maintenanceMode: false,
    brandColor: '#EB216A',
    siteLogo: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAll();
      if (response && response.data) {
        // Filter out any nested 'settings' key from response
        const { settings: nestedSettings, ...cleanData } = response.data;
        setSettings(prev => ({
          ...prev,
          ...cleanData
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Filter out any nested 'settings' key before saving
      const { settings: nestedSettings, ...cleanSettings } = settings as any;
      console.log('Saving settings:', cleanSettings);

      const response = await settingsApi.updateBulk(cleanSettings);

      if (response.success) {
        toast.success('Pengaturan berhasil disimpan');
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Gagal menyimpan pengaturan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const response = await uploadApi.uploadFile(file);

      if (response.success && response.data?.url) {
        setSettings(prev => ({ ...prev, siteLogo: response.data.url }));
        toast.success('Logo berhasil diupload');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Gagal mengupload logo: ' + error.message);
    } finally {
      setUploadingLogo(false);
      // Reset input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, siteLogo: '' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#EB216A] mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Kelola pengaturan website</p>
        </div>
        <Button
          className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan
            </>
          )}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-[#EB216A] data-[state=active]:text-white"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="data-[state=active]:bg-[#EB216A] data-[state=active]:text-white"
          >
            Contact
          </TabsTrigger>
          <TabsTrigger
            value="features"
            className="data-[state=active]:bg-[#EB216A] data-[state=active]:text-white"
          >
            Features
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card className="p-6 border-gray-200">
            <h3 className="text-lg text-gray-900 mb-6">Informasi Website</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="siteName">Nama Website</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="siteEmail">Email</Label>
                <Input
                  id="siteEmail"
                  type="email"
                  value={settings.siteEmail}
                  onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-gray-200">
            <h3 className="text-lg text-gray-900 mb-6">Logo & Branding</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Logo Website</Label>
                <div className="flex items-center gap-4">
                  {settings.siteLogo ? (
                    <div className="relative">
                      <img
                        src={settings.siteLogo}
                        alt="Site Logo"
                        className="w-20 h-20 object-contain bg-gray-100 rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-[#EB216A] rounded-lg flex items-center justify-center">
                      <span className="text-white text-2xl">A</span>
                    </div>
                  )}
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      variant="outline"
                      className="border-gray-300"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, atau SVG. Maks 2MB.</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="brandColor">Brand Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="brandColor"
                    type="color"
                    value={settings.brandColor}
                    onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.brandColor}
                    onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                    className="flex-1"
                    placeholder="#EB216A"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact" className="space-y-6 mt-6">
          <Card className="p-6 border-gray-200">
            <h3 className="text-lg text-gray-900 mb-6">Kontak Informasi</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sitePhone">Nomor Telepon</Label>
                <Input
                  id="sitePhone"
                  value={settings.sitePhone}
                  onChange={(e) => setSettings({ ...settings, sitePhone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="628xxxxxxxxxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="siteAddress">Alamat</Label>
                <Textarea
                  id="siteAddress"
                  value={settings.siteAddress}
                  onChange={(e) => setSettings({ ...settings, siteAddress: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-gray-200">
            <h3 className="text-lg text-gray-900 mb-6">Social Media</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input
                  id="instagramUrl"
                  value={settings.instagramUrl}
                  onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input
                  id="facebookUrl"
                  value={settings.facebookUrl}
                  onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features" className="space-y-6 mt-6">
          <Card className="p-6 border-gray-200">
            <h3 className="text-lg text-gray-900 mb-6">Fitur Website</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Kirim notifikasi email untuk pesanan baru
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Newsletter</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Aktifkan fitur newsletter untuk customer
                  </p>
                </div>
                <Switch
                  checked={settings.enableNewsletter}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableNewsletter: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Product Reviews</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Izinkan customer memberikan review produk
                  </p>
                </div>
                <Switch
                  checked={settings.enableReviews}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableReviews: checked })
                  }
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-gray-200">
            <h3 className="text-lg text-gray-900 mb-6">Maintenance Mode</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Maintenance</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Website akan menampilkan halaman maintenance
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, maintenanceMode: checked })
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}