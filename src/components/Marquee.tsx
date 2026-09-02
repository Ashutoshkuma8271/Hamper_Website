const items = [
  'Hand-packed in small batches',
  'Personalised photo cards',
  'On-the-day delivery',
  'Custom branded ribbons',
  'GST invoicing',
  'Multi-address dispatch',
];

export default function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="border-y border-cream-200 bg-cream-100/60 py-4 overflow-hidden">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {row.map((t, i) => (
          <div key={i} className="flex items-center gap-10">
            <span className="font-display italic text-wine-600/80 text-sm sm:text-base">
              {t}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
          </div>
        ))}
      </div>
    </div>
  );
}
