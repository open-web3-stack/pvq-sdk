import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

export const ImageWithFallback = ({
  fallbackClassName,
  fallback,
  alt,
  src,
  className,
  width,
  height,
  ...props
}: {
  fallbackClassName?: string;
  fallback?: React.ReactNode;
  alt: string;
  src: string;
  className?: string;
  width?: number;
  height?: number;
}) => {
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  return !error ? (
    <Image
      alt={alt}
      className={className}
      onError={() => setError(true)}
      src={src}
      width={width}
      height={height}
      {...props}
    />
  ) : (
    <div className={cn(className, fallbackClassName)} {...props}>
      {fallback}
    </div>
  );
};
