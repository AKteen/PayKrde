import { CATEGORY_TAGS, MAJOR_TAGS, MEAL_TAGS, PAYMENT_MODES, VEHICLE_TAGS, type AllowedTag } from '@kharcha/shared';
import { TagChip } from '@/lib/tag-meta';
import { cn } from '@/lib/utils';

type TagPickerProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  compact?: boolean;
  mode?: 'personal' | 'vehicle';
};

export function TagPicker({ value, onChange, compact, mode = 'personal' }: TagPickerProps) {
  function toggle(tag: AllowedTag) {
    if ((PAYMENT_MODES as readonly string[]).includes(tag)) {
      const withoutPay = value.filter((t) => !(PAYMENT_MODES as readonly string[]).includes(t));
      if (value.includes(tag)) onChange(withoutPay);
      else onChange([...withoutPay, tag]);
      return;
    }
    if (value.includes(tag)) onChange(value.filter((t) => t !== tag));
    else onChange([...value, tag]);
  }

  const categoryTags =
    mode === 'vehicle' ? VEHICLE_TAGS : ([...MEAL_TAGS, ...MAJOR_TAGS, ...CATEGORY_TAGS] as const);

  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-2')}>
      {mode === 'personal' ? (
        <p className="text-[11px] font-medium text-muted-foreground">Category</p>
      ) : null}
      <div className="no-scrollbar flex flex-nowrap gap-1.5 overflow-x-auto pb-1 md:flex-wrap">
        {categoryTags.map((tag) => (
          <TagChip key={tag} tag={tag} selected={value.includes(tag)} onClick={() => toggle(tag)} />
        ))}
      </div>
      {mode === 'personal' ? (
        <>
          <p className="text-[11px] font-medium text-muted-foreground">Paid with · defaults to Online (bank)</p>
          <div className="no-scrollbar flex flex-nowrap gap-1.5 overflow-x-auto pb-1 md:flex-wrap">
            {PAYMENT_MODES.map((tag) => (
              <TagChip key={tag} tag={tag} selected={value.includes(tag)} onClick={() => toggle(tag)} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
