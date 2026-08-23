import Image from "next/image";

export function StudyHaulLogo({
  size = 40,
  showWordmark = false,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative shrink-0 overflow-hidden rounded-2xl bg-orange-50 shadow-sm ring-1 ring-orange-100"
        style={{ width: size, height: size }}
      >
        <Image
          src="/study-haul-books.png"
          alt="Study Haul"
          fill
          className="object-cover"
          sizes={`${size}px`}
          priority
        />
      </div>
      {showWordmark ? (
        <div>
          <p className="text-lg font-black tracking-tight text-stone-900">
            Study Haul
          </p>
          <p className="text-xs font-medium text-stone-500">
            Your semester, organized
          </p>
        </div>
      ) : null}
    </div>
  );
}
