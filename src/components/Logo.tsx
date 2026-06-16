import React from "react";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export default function Logo({ size = 40, className, ...props }: LogoProps) {
  return (
    <img
      src="/horashub_logo.png"
      alt="HorasHub Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", ...props.style }}
      {...props}
    />
  );
}
