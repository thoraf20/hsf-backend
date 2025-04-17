const timeUnits: TimeSpanUnit[] = ['ms', 's', 'm', 'h', 'd', 'w']
const pattern = new RegExp(
  String.raw`^(?<duration>\d+)(?<unit>${timeUnits.join('|')})$`,
)

export function isSupportedTimeUnit(value: string) {
  return pattern.test(value)
}

export function parseStrTimeUnit(value: string) {
  if (!isSupportedTimeUnit(value)) {
    return null
  }

  const match = pattern.exec(value)
  if (!match || !match.groups) {
    return null // Or throw an error, depending on desired behavior
  }

  const duration = match.groups.duration
  const unit = match.groups.unit as TimeSpanUnit

  return new TimeSpan(Number(duration), unit)
}

export class TimeSpan {
  constructor(
    public duration: number,
    public unit: TimeSpanUnit,
  ) {}

  public toMilliseconds(): number {
    switch (this.unit) {
      case 'ms':
        return this.duration
      case 's':
        return this.duration * 1000
      case 'm':
        return this.duration * 60 * 1000
      case 'h':
        return this.duration * 60 * 60 * 1000
      case 'd':
        return this.duration * 24 * 60 * 60 * 1000
      case 'w':
        return this.duration * 7 * 24 * 60 * 60 * 1000
      default:
        return 0
    }
  }

  public toSeconds(): number {
    return this.toMilliseconds() / 1000
  }

  public toString(): string {
    return `${this.duration}${this.unit}`
  }
}

export function createDate(
  timeSpan: TimeSpan,
  startDate: Date = new Date(),
): Date {
  const millisecondsToAdd = timeSpan.toMilliseconds()
  const newDate = new Date(startDate.getTime() + millisecondsToAdd)
  return newDate
}

export type TimeSpanUnit = 'ms' | 's' | 'm' | 'h' | 'd' | 'w'
