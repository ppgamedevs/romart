import Image from "next/image";

interface CdnImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  sizes?: string;
}

export function CdnImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = "empty",
  sizes
}: CdnImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder={placeholder}
      className={className}
      sizes={sizes}
    />
  );
}
