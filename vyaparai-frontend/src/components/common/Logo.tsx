import { LOGO_PATH } from '../../constants'

interface LogoProps {
  height?: number
  className?: string
}

/**
 * Renders the official VyaparAI logo exactly as provided.
 * Do not replace with text initials or a redesigned mark.
 */
export default function Logo({ height = 40, className = '' }: LogoProps) {
  return (
    <img
      src={LOGO_PATH}
      alt="VyaparAI"
      style={{ height, width: 'auto' }}
      className={className}
    />
  )
}
