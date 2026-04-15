import { useEffect, useState } from 'react'
import { getProjectCoverSrc } from '../lib/projectCovers'

type ProjectCoverMediaProps = {
  cover?: string
  alt: string
  className?: string
  fallbackText: string
}

export default function ProjectCoverMedia({
  cover,
  alt,
  className,
  fallbackText
}: ProjectCoverMediaProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [cover])

  const src = getProjectCoverSrc(cover)

  if (!src || failed) {
    return (
      <div className="project-cover-fallback" role="img" aria-label={alt}>
        <span>{fallbackText}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={960}
      height={540}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
