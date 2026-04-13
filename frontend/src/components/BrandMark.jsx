/** Wowcar header logo — `frontend/public/assets/images/Wow-Logo-Header.png` */
const LOGO_SRC = "/assets/images/Wow-Logo-Header.png";

export default function BrandMark({ className = "" }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Wowcar — used cars near home"
      width={260}
      height={72}
      decoding="async"
      fetchPriority="high"
      className={`h-9 w-auto max-h-11 sm:h-10 sm:max-h-12 max-w-[min(220px,52vw)] sm:max-w-[260px] object-contain object-left select-none ${className}`}
    />
  );
}
