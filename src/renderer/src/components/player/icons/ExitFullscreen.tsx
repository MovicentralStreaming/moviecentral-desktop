export function ExitFullscreen({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      role="img"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 8H19V3H17V9V10H18H24V8ZM0 16H5V21H7V15V14H6H0V16ZM7 10H6H0V8H5V3H7V9V10ZM19 21V16H24V14H18H17V15V21H19Z"
        fill="currentColor"
      ></path>
    </svg>
  )
}
