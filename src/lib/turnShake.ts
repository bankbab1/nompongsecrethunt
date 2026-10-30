/**
 * How hard the active player's avatar shakes: a calm wiggle while there's time,
 * a steady shake in the last 10 seconds, and a hard shake in the last 5.
 */
export function turnShake(yourTurn: boolean, secondsLeft: number | null): string {
  if (!yourTurn) return ''
  if (secondsLeft !== null && secondsLeft <= 5) return 'animate-shake-hard'
  if (secondsLeft !== null && secondsLeft <= 10) return 'animate-shake'
  return 'animate-wiggle'
}
