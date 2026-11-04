import Image from 'next/image';
import { SDG_COLORS, SDG_NAMES_TH, sdgLabel } from '@/lib/sdg';

interface SdgBadgesProps {
  goals: number[];
  className?: string;
  /** แสดงคำว่า SDGs นำหน้าแถว badge */
  showLabel?: boolean;
}

export default function SdgBadges({ goals, className = '', showLabel = true }: SdgBadgesProps) {
  if (goals.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1 ${className}`}
      aria-label={`เป้าหมายการพัฒนาที่ยั่งยืน: ${goals.map((g) => SDG_NAMES_TH[g] ?? g).join(', ')}`}
    >
      {showLabel && (
        <Image
          src="/sdg-wheel.png"
          alt="เป้าหมายการพัฒนาที่ยั่งยืน (SDGs)"
          width={22}
          height={22}
          className="mr-0.5 h-5 w-5 shrink-0 sm:h-[22px] sm:w-[22px]"
        />
      )}
      {goals.map((goal) => (
        <span
          key={goal}
          title={sdgLabel(goal)}
          style={{ backgroundColor: SDG_COLORS[goal] }}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] text-[10px] font-bold leading-none text-white shadow-sm sm:h-[22px] sm:w-[22px] sm:text-[11px]"
        >
          {goal}
        </span>
      ))}
    </div>
  );
}
