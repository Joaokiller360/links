import { useEffect, useState } from 'react';

export default function Avatar({ initials, photo, className = '' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [photo]);

  return (
    <div
      className={`grid size-24 place-items-center overflow-hidden rounded-full border-2 border-brand bg-linear-145 from-[#13241c] to-card text-3xl font-bold tracking-[0.02em] text-white shadow-[0_0_32px_rgba(0,210,106,0.18)] ${className}`}
      aria-hidden="true"
    >
      {photo && !failed ? (
        <img className="size-full object-cover" src={photo} alt="" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </div>
  );
}
