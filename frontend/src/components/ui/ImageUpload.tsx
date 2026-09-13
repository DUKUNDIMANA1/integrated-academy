import React from 'react';

interface ImageUploadProps {
  label?: string;
  hint?: string;
  /** Current image URL (preview). Empty = show placeholder. */
  value?: string | null;
  onSelect: (file: File) => void;
  onRemove?: () => void;
  uploading?: boolean;
  /** Rounded preview shape */
  shape?: 'rounded' | 'circle' | 'banner';
  accept?: string;
}

/**
 * Reusable image picker with live preview.
 * The parent handles the actual upload; this component only picks + previews.
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  label, hint, value, onSelect, onRemove, uploading, shape = 'rounded', accept = 'image/*',
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  // Clear local preview whenever the saved value changes (e.g. after upload)
  React.useEffect(() => { setPreview(null); }, [value]);

  const shapeClass =
    shape === 'circle' ? 'w-24 h-24 rounded-full' :
    shape === 'banner' ? 'w-full h-32 rounded-xl' :
    'w-full h-40 rounded-xl';

  const src = preview || value || null;

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    if (f.size > 5 * 1024 * 1024) return;
    setPreview(URL.createObjectURL(f));
    onSelect(f);
    // reset input so the same file can be picked again
    e.target.value = '';
  };

  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="flex items-start gap-4">
        <div className={`${shapeClass} bg-gray-100 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 relative`}>
          {src ? (
            <img src={src} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-300 text-3xl">🖼️</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={pick} />
          <button type="button" disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors">
            {value || preview ? 'Change picture' : 'Upload picture'}
          </button>
          {(value || preview) && onRemove && (
            <button type="button" disabled={uploading} onClick={() => { setPreview(null); onRemove(); }}
              className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 text-left">
              Remove
            </button>
          )}
          {hint && <p className="text-xs text-gray-400 max-w-[220px]">{hint}</p>}
        </div>
      </div>
    </div>
  );
};
