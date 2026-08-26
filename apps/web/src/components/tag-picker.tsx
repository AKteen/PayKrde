import { CATEGORY_TAGS, MAJOR_TAGS, TAG_LABELS, type AllowedTag } from '@kharcha/shared';
import { cn } from '@/lib/utils';

type TagPickerProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  compact?: boolean;
};

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 min-h-[32px] rounded-full border px-2.5 text-xs',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-surface text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

export function TagPicker({ value, onChange, compact }: TagPickerProps) {
  function toggle(tag: AllowedTag) {
    if (value.includes(tag)) onChange(value.filter((t) => t !== tag));
    else onChange([...value, tag]);
  }

  return (
    <div className={cn('flex flex-col gap-2', compact && 'gap-1.5')}>
      <div className="flex flex-wrap gap-1.5">
        {MAJOR_TAGS.map((tag) => (
          <Chip key={tag} selected={value.includes(tag)} onClick={() => toggle(tag)}>
            {TAG_LABELS[tag]}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_TAGS.map((tag) => (
          <Chip key={tag} selected={value.includes(tag)} onClick={() => toggle(tag)}>
            {TAG_LABELS[tag]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
