import React, { useEffect, useState } from 'react';
import { Save, Settings, Image as ImageIcon } from 'lucide-react';
import { communicationApi } from '../../api/communication.api';
import { uploadsApi } from '../../api/uploads.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { PageSpinner } from '../../components/ui/Spinner';
import { refreshBranding } from '../../hooks/useBranding';
import toast from 'react-hot-toast';

interface Setting { key: string; value: string; category: string; description?: string; }

const BRAND_SLOTS = [
  { key: 'branding.logo', label: 'Academy Logo', hint: 'Square PNG works best (e.g. 512x512). Shown in sidebar, login and public site.', shape: 'rounded' as const },
  { key: 'branding.favicon', label: 'Favicon', hint: 'Small browser-tab icon (e.g. 64x64 PNG).', shape: 'rounded' as const },
  { key: 'branding.banner', label: 'Login / Banner Image', hint: 'Wide image for login panel (e.g. 1600x900).', shape: 'banner' as const },
];

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [brandValues, setBrandValues] = useState<Record<string, string>>({});
  const [uploadingBrand, setUploadingBrand] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      communicationApi.getSettings().then(r => r.data.data || []),
      uploadsApi.getBranding().then(r => r.data.data || {}).catch(() => ({})),
    ])
      .then(([data, branding]: [Setting[], Record<string, string>]) => {
        setSettings(data);
        const vals: Record<string, string> = {};
        data.forEach(s => { vals[s.key] = s.value; });
        setValues(vals);
        setBrandValues(branding || {});
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string, category: string, description?: string) => {
    setSaving(key);
    try {
      await communicationApi.saveSetting({ key, value: values[key], category, description });
      toast.success('Setting saved');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(null); }
  };

  const grouped = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, Setting[]>);

  const handleBrandUpload = async (key: string, file: File) => {
    setUploadingBrand(key);
    try {
      const r = await uploadsApi.uploadBranding(key, file);
      setBrandValues(p => ({ ...p, [key]: r.data.data.url as string }));
      await refreshBranding();
      toast.success('Branding image uploaded - visible everywhere now');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploadingBrand(null); }
  };

  const handleBrandRemove = async (key: string) => {
    setUploadingBrand(key);
    try {
      await uploadsApi.removeBranding(key.replace(/^branding\./, ''));
      setBrandValues(p => ({ ...p, [key]: '' }));
      await refreshBranding();
      toast.success('Branding image removed');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setUploadingBrand(null); }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-gray-500" />
        <div><h1>System Settings</h1><p className="text-sm text-gray-500">Configure organization-wide settings</p></div>
      </div>

      {/* Branding / logo picture uploads */}
      <div className="card">
        <h3 className="font-semibold mb-1 pb-3 border-b border-gray-100 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gray-400" /> Branding &amp; Logo
        </h3>
        <p className="text-xs text-gray-400 mt-2 mb-4">
          Upload pictures here to change the logo and related images. Changes apply instantly everywhere.
        </p>
        <div className="space-y-6">
          {BRAND_SLOTS.map(slot => (
            <ImageUpload
              key={slot.key}
              label={slot.label}
              hint={slot.hint}
              shape={slot.shape}
              value={brandValues[slot.key] || ''}
              uploading={uploadingBrand === slot.key}
              onSelect={f => handleBrandUpload(slot.key, f)}
              onRemove={brandValues[slot.key] ? () => handleBrandRemove(slot.key) : undefined}
            />
          ))}
        </div>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="card">
          <h3 className="font-semibold capitalize mb-4 pb-3 border-b border-gray-100">
            {category.replace(/_/g, ' ')} Settings
          </h3>
          <div className="space-y-4">
            {items.map((s: Setting) => (
              <div key={s.key} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="label">{s.key.split('.').pop()?.replace(/_/g, ' ')}</label>
                  {s.description && <p className="text-xs text-gray-400 mb-1">{s.description}</p>}
                  <Input
                    value={values[s.key] || ''}
                    onChange={e => setValues(p => ({ ...p, [s.key]: e.target.value }))}
                    placeholder={s.key}
                  />
                </div>
                <Button
                  size="sm"
                  loading={saving === s.key}
                  icon={<Save className="w-3.5 h-3.5" />}
                  onClick={() => handleSave(s.key, s.category, s.description)}
                >
                  Save
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {settings.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          No settings found. Run the database seed to populate default settings.
        </div>
      )}
    </div>
  );
};
