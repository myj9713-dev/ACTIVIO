import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { SPORTS } from '@/constants/sports';

const SportSelect = forwardRef<
  HTMLSelectElement,
  { id: string; value?: string } & React.SelectHTMLAttributes<HTMLSelectElement>
>(({ id, value, ...rest }, ref) => {
  const selectedSport = SPORTS.find((s) => s.slug === value);

  return (
    <div className="relative">
      {selectedSport && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base leading-none"
        >
          {selectedSport.icon}
        </span>
      )}
      <select
        id={id}
        ref={ref}
        value={value}
        {...rest}
        className={`w-full bg-input-bg border-none rounded-2xl py-4 pr-10 text-base focus:ring-2 focus:ring-btn-focus outline-none transition-all appearance-none cursor-pointer ${
          value ? 'text-text-primary' : 'text-text-secondary'
        }`}
        style={{ paddingLeft: selectedSport ? '40px' : '16px' }}
      >
        <option value="" className="bg-bg-surface text-text-secondary">
          운동 종목을 선택하세요
        </option>
        {SPORTS.map((s) => (
          <option
            key={s.slug}
            value={s.slug}
            className="bg-bg-surface text-text-primary"
          >
            {s.icon} {s.name}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"
      />
    </div>
  );
});
SportSelect.displayName = 'SportSelect';

export default SportSelect;
