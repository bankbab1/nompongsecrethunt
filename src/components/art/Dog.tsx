interface DogProps {
  color?: string
  collar?: string
  className?: string
}

/** Nompong and friends: one puppy face, recoloured per player. */
export function Dog({ color = '#e9c47e', collar = '#819a58', className }: DogProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <ellipse cx="50" cy="87" rx="29" ry="7" fill="#395b3020" />
      <path d="M28 37Q9 24 15 65Q20 78 32 60M72 37Q91 24 85 65Q80 78 68 60" fill="#ac7d48" />
      <path d="M25 39Q28 16 50 19Q73 17 77 41L73 68Q68 85 50 85Q29 83 26 66Z" fill={color} />
      <path d="M44 25Q51 18 57 25L61 59H39Z" fill="#fff6df" />
      <ellipse cx="50" cy="66" rx="22" ry="17" fill="#fff6df" />
      <ellipse cx="35" cy="51" rx="3.5" ry="5" fill="#40392e" />
      <ellipse cx="65" cy="51" rx="3.5" ry="5" fill="#40392e" />
      <circle cx="36" cy="49" r="1" fill="white" />
      <circle cx="66" cy="49" r="1" fill="white" />
      <path d="M44 60Q50 56 56 60Q57 65 50 67Q43 65 44 60" fill="#493e32" />
      <path d="M50 67V72M42 71Q50 78 58 71" fill="none" stroke="#67503b" strokeWidth="2" strokeLinecap="round" />
      <path d="M47 75Q50 72 54 75V79Q50 86 47 79Z" fill="#df9c92" />
      <path d="M29 80Q50 91 71 80L69 88Q50 97 31 88Z" fill={collar} />
      <circle cx="50" cy="89" r="5" fill="#eac773" />
    </svg>
  )
}
