declare module 'lunar-javascript' {
  interface Lunar {
    getYear(): number
    getMonth(): number
    getDay(): number
    getHour(): number
    getMinute(): number
    getSecond(): number
    getYearInGanZhi(): string
    getYearInGanZhiByLiChun(): string
    getYearInGanZhiExact(): string
    getMonthInGanZhi(): string
    getMonthInGanZhiExact(): string
    getDayInGanZhi(): string
    getDayInGanZhiExact(): string
    getTimeInGanZhi(): string
    getYearGanIndex(): number
    getYearGanIndexByLiChun(): number
    getYearGanIndexExact(): number
    getYearZhiIndex(): number
    getYearZhiIndexByLiChun(): number
    getYearZhiIndexExact(): number
    getMonthGanIndex(): number
    getMonthGanIndexExact(): number
    getMonthZhiIndex(): number
    getMonthZhiIndexExact(): number
    getDayGanIndex(): number
    getDayGanIndexExact(): number
    getDayZhiIndex(): number
    getDayZhiIndexExact(): number
    getTimeGanIndex(): number
    getTimeZhiIndex(): number
    getYearInChinese(): string
    getMonthInChinese(): string
    getDayInChinese(): string
    getEightChar(): EightChar
    getLunar(): Lunar
    getSolar(): Solar
  }

  interface EightChar {
    getYear(): string
    getMonth(): string
    getDay(): string
    getTime(): string
  }

  interface SolarInstance {
    getLunar(): Lunar
    getSolar(): SolarInstance
  }

  export const Solar: {
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): SolarInstance
    fromYmd(year: number, month: number, day: number): SolarInstance
    fromDate(date: Date): SolarInstance
  }

  export const Lunar: {
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Lunar
    fromDate(date: Date): Lunar
  }
}
