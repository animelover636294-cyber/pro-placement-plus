import { useState } from "react";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  /** Optional responsive sources, e.g. { 640: url640, 960: url960 } */
  srcSetMap?: Record<number, string>;
  sizes?: string;
  /** Tiny base64 image used as a blurred placeholder while loading */
  blurDataURL?: string;
  width: number;
  height: number;
  alt: string;
  priority?: boolean;
}

/**
 * Vite-friendly equivalent of next/image: responsive srcset, explicit
 * intrinsic size (no layout shift) and a blurred LQIP placeholder.
 */
export function OptimizedImage({
  src,
  srcSetMap,
  sizes = "100vw",
  blurDataURL,
  width,
  height,
  alt,
  priority = false,
  className = "",
  ...rest
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  const srcSet = srcSetMap
    ? Object.entries(srcSetMap)
        .map(([w, url]) => `${url} ${w}w`)
        .join(", ")
    : undefined;

  return (
    <div
      className="relative overflow-hidden"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {blurDataURL && (
        <div
          aria-hidden
          className={`absolute inset-0 scale-110 bg-cover bg-center blur-xl transition-opacity duration-500 ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
          style={{ backgroundImage: `url(${blurDataURL})` }}
        />
      )}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        // @ts-expect-error fetchpriority is valid HTML but not yet in React types
        fetchpriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        className={`relative h-full w-full object-contain transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        {...rest}
      />
    </div>
  );
}
