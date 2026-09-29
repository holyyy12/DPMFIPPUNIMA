'use client';
import { useState } from 'react';

export function OrganizationLogo({
  name,
  shortName,
  logo,
}: {
  name: string;
  shortName?: string;
  logo?: unknown;
}) {
  const [failed, setFailed] = useState('');
  const url =
    typeof logo === 'string' &&
    (/^https?:\/\//.test(logo) || /^\/(?!\/)/.test(logo))
      ? logo
      : '';
  return url && failed !== url ? (
    <img
      className="organization-logo"
      src={url}
      alt={`Logo ${name}`}
      loading="lazy"
      onError={() => setFailed(url)}
    />
  ) : (
    <span className="organization-logo-fallback" aria-label={name}>
      {shortName || name.slice(0, 4).toUpperCase()}
    </span>
  );
}
