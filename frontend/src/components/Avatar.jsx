import { useEffect, useState } from 'react';

export default function Avatar({ initials, photo }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [photo]);

  return (
    <div className="avatar" aria-hidden="true">
      {photo && !failed ? <img src={photo} alt="" onError={() => setFailed(true)} /> : initials}
    </div>
  );
}
