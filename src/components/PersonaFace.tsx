"use client";

import Image from "next/image";
import { personaAvatarUrl } from "@/lib/persona-avatar";

export default function PersonaFace({
  personaId,
  displayName,
  size = 52,
  className = "",
}: {
  personaId: string;
  displayName: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={personaAvatarUrl(personaId)}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`shrink-0 rounded-full bg-white/20 object-cover ring-2 ring-white/25 shadow-md ${className}`}
      title={displayName}
    />
  );
}
