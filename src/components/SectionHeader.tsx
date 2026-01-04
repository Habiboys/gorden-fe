interface SectionHeaderProps {
  badge?: string;
  title: string;
  description: string;
  alignment?: 'left' | 'center';
}

export function SectionHeader({
  badge,
  title,
  description,
  alignment = 'center'
}: SectionHeaderProps) {
  const alignmentClass = alignment === 'center' ? 'text-center mx-auto' : 'text-left';
  const maxWidthClass = alignment === 'center' ? 'max-w-3xl' : 'max-w-2xl';

  return (
    <div className={`${alignmentClass} ${maxWidthClass} mb-12`}>
      {/* Badge */}
      {badge && (
        <p className="text-sm tracking-[0.2em] text-[#EB216A] uppercase mb-3">
          {badge}
        </p>
      )}

      {/* Title - using serif font */}
      <h2 className="text-xl md:text-2xl lg:text-3xl mb-3 font-bold text-gray-900">
        {title}
      </h2>

      {/* Description */}
      <p className="text-gray-600 text-sm md:text-base">
        {description}
      </p>
    </div>
  );
}