import Image from "next/image";
import type { ReactNode } from "react";

export function FieldHero({
  title,
  description,
  image,
  imageAlt = "",
  className = "",
  children,
}: {
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section className={`field-hero ${className}`} aria-labelledby="field-heading" data-enter>
      <div className="field-hero-image">
        <Image src={image} alt={imageAlt} fill priority sizes="(max-width: 767px) 100vw, 60vw" />
      </div>
      <div className="field-wrap field-hero-inner">
        <div className="field-hero-copy">
          <h1 id="field-heading" className="field-display">{title}</h1>
          <p>{description}</p>
          {children}
        </div>
      </div>
    </section>
  );
}
