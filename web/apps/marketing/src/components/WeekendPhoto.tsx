"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export function WeekendPhoto() {
  const photo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = photo.current;
    if (!frame || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      frame.dataset.developed = "true";
      observer.disconnect();
    }, { threshold: 0.2 });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={photo} className="home-weekend-photo" data-moment="picture-develops">
      <Image src="/images/pexels-fanuel-33019023.jpg" alt="An Addis Ababa avenue after rain" fill sizes="(max-width: 820px) 100vw, 55vw" />
    </div>
  );
}
