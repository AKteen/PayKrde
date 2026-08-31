import { useEffect, useRef, useState } from 'react';
import type { Vehicle } from '@kharcha/shared';
import { VEHICLE_KIND_LABELS, VEHICLE_KINDS, VehicleSchema, zodFieldErrors, type FieldErrors } from '@kharcha/shared';
import { ApiError, api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GIcon } from '@/lib/tag-meta';
import { fileToDataUrl } from '@/lib/vehicle';
import { cn } from '@/lib/utils';

const ICONS = [
  { id: '2w', kind: '2w' as const, src: '/2w-skeleton.png', label: '2 wheeler' },
  { id: '4w', kind: '4w' as const, src: '/4w-skeleton.png', label: '4 wheeler' },
];

export function AddVehicleCard({
  initial,
  onAdded,
  onCancel,
}: {
  initial?: Vehicle;
  onAdded: (vehicle: Vehicle) => void;
  onCancel?: () => void;
}) {
  const { refresh } = useDataRefresh();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.name ?? '');
  const [plate, setPlate] = useState(initial?.number_plate ?? '');
  const [kind, setKind] = useState<'2w' | '4w'>(initial?.kind ?? '2w');
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial);

  useEffect(() => {
    setName(initial?.name ?? '');
    setPlate(initial?.number_plate ?? '');
    setKind(initial?.kind ?? '2w');
    setImageUrl(initial?.image_url ?? null);
    setFields({});
    setError(null);
    setPickerOpen(false);
  }, [initial?.id]);

  const preview = imageUrl || (kind === '4w' ? '/4w-skeleton.png' : '/2w-skeleton.png');

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFields({ image_url: 'Choose an image file.' });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setFields({ image_url: 'Image must be under 4 MB.' });
      return;
    }
    try {
      setImageUrl(await fileToDataUrl(file));
      setFields((prev) => ({ ...prev, image_url: '' }));
      setPickerOpen(false);
    } catch (err) {
      setFields({
        image_url: err instanceof Error ? err.message : 'Could not read that image.',
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = VehicleSchema.safeParse({
      name,
      kind,
      image_url: imageUrl,
      number_plate: plate,
    });
    if (!parsed.success) {
      const issues = zodFieldErrors(parsed.error);
      setFields(issues.fields);
      setError(issues.error);
      return;
    }
    setSaving(true);
    try {
      const saved = initial
        ? await api<Vehicle>(`/api/vehicles/${initial.id}`, {
            method: 'PATCH',
            body: JSON.stringify(parsed.data),
          })
        : await api<Vehicle>('/api/vehicles', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
          });
      if (!initial) {
        setName('');
        setPlate('');
        setImageUrl(null);
        setKind('2w');
      }
      setFields({});
      refresh();
      onAdded(saved);
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : editing ? 'Could not save vehicle' : 'Could not add vehicle');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? 'Edit vehicle' : 'Add vehicle'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <div className="flex items-start gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="flex h-20 w-28 flex-col items-center justify-center rounded-2xl bg-muted"
                aria-label="Choose vehicle icon"
              >
                <img src={preview} alt="" className="h-14 w-24 object-contain" />
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="mt-1 w-full text-center text-[10px] font-medium text-muted-foreground hover:text-foreground"
              >
                Choose icon or photo
              </button>
              {pickerOpen ? (
                <div className="absolute left-0 top-[5.5rem] z-20 w-56 rounded-2xl border border-border bg-surface p-2 shadow-card">
                  <p className="mb-2 px-1 text-[11px] text-muted-foreground">Pick an icon or upload a photo</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ICONS.map((icon) => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => {
                          setKind(icon.kind);
                          setImageUrl(null);
                          setPickerOpen(false);
                        }}
                        className={cn(
                          'flex flex-col items-center rounded-xl border p-1.5',
                          !imageUrl && kind === icon.kind ? 'border-primary bg-cream' : 'border-border',
                        )}
                      >
                        <img src={icon.src} alt="" className="h-10 w-full object-contain" />
                        <span className="mt-1 text-[10px]">{icon.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-xl border p-1.5',
                        imageUrl ? 'border-primary bg-cream' : 'border-border',
                      )}
                    >
                      <GIcon name="add_a_photo" className="text-[20px]" />
                      <span className="mt-1 text-[10px]">Upload</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="v-name">Vehicle name</Label>
              <Input
                id="v-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFields((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Activa, Creta"
                aria-invalid={Boolean(fields.name)}
              />
              <FieldError message={fields.name} />
            </div>
          </div>
          <div>
            <Label htmlFor="v-plate">
              Number plate <span className="font-normal">(optional)</span>
            </Label>
            <Input
              id="v-plate"
              value={plate}
              onChange={(e) => {
                setPlate(e.target.value.toUpperCase());
                setFields((prev) => ({ ...prev, number_plate: '' }));
              }}
              placeholder="MH 12 AB 1234"
              maxLength={16}
              autoCapitalize="characters"
              aria-invalid={Boolean(fields.number_plate)}
            />
            <FieldError message={fields.number_plate} />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
          <div className="flex rounded-full bg-muted p-1">
            {VEHICLE_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  if (!imageUrl) setImageUrl(null);
                }}
                className={`flex-1 rounded-full py-2 text-xs font-medium ${
                  kind === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {VEHICLE_KIND_LABELS[k]}
              </button>
            ))}
          </div>
          <FieldError message={fields.kind || fields.image_url} />
          {error && !fields.name && !fields.kind && !fields.image_url && !fields.number_plate ? (
            <p className="text-xs text-danger">{error}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="min-h-[44px] flex-1">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add vehicle'}
            </Button>
            {onCancel ? (
              <Button type="button" variant="outline" className="min-h-[44px]" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
