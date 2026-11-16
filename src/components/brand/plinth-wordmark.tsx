/**
 * The Plinth wordmark as inline SVG, colored with currentColor. The paths are the same as
 * public/brand/plinth-wordmark.svg (a browser test keeps the two identical).
 */
export function PlinthWordmark({ height = 22, className }: { height?: number; className?: string }) {
  return (
    <svg width={(76 / 22) * height} height={height} viewBox="0 0 76 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" className={className}>
      <path d="M0 0H12.8571V2.14286H15V12.8571H12.8571V15H4.28571V21.4286H0V0ZM10.7143 4.28571H4.28571V10.7143H10.7143V4.28571Z" />
      <path d="M17.1484 0H21.4342V21.4286H17.1484V0Z" />
      <path d="M23.5938 0H27.8795V4.28571H23.5938V0ZM23.5938 6.42857H27.8795V21.4286H23.5938V6.42857Z" />
      <path d="M34.3248 6.4285H36.4676V4.28564H42.8962V6.4285H45.0391V21.4285H40.7533V8.57136H34.3248V21.4285H30.0391V4.28564H34.3248V6.4285Z" />
      <path d="M47.1875 6.42857H49.3304V2.14286H51.4732V0H53.6161V6.42857H57.9018V10.7143H53.6161V17.1429H57.9018V21.4286H51.4732V19.2857H49.3304V10.7143H47.1875V6.42857Z" />
      <path d="M64.3248 6.42857H66.4676V4.28571H72.8962V6.42857H75.0391V21.4286H70.7533V8.57143H64.3248V21.4286H60.0391V0H64.3248V6.42857Z" />
    </svg>
  );
}
