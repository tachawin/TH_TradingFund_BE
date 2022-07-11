import { LError } from './errors.handler';

const TIME_TWELVE_FORMAT = {
  am: {
    start: {
      hours: 0,
      min: 0,
    },
    end: {
      hours: 12,
      min: 0,
    },
  },
  pm: {
    start: {
      hours: 12,
      min: 1,
    },
    end: {
      hours: 23,
      min: 59,
    },
  },
};

export function toDateYMD(date: string) {
  const time = date.split('-');

  if (time.length !== 3) {
    throw LError('[time.handler]: unable to parse time filter format');
  }

  return {
    year: parseInt(time[0], 10),
    month: parseInt(time[1], 10),
    day: parseInt(time[2], 10),
  };
}

export function addHoursToDate(date: Date, hours: number): Date {
  return new Date(new Date(date).setHours(date.getHours() + hours));
}

export function toDateTHTimeZoneByDate(date?: Date): Date {
  let targetDate = new Date();
  if (date) {
    targetDate = new Date(date);
  }

  return addHoursToDate(targetDate, 7);
}

export function toDateTHTimeZoneByYMD(year: number, month: number, day: number, direct: 'ceil' | 'floor'): Date {
  let date = new Date(year, month - 1, day);

  if (direct === 'ceil') {
    date = new Date(year, month - 1, day, 23, 59);
  }

  return addHoursToDate(date, 7);
}

export function timeFilterToDateTHTimeZone(date: string): Date {
  const { year, month, day } = toDateYMD(date);

  return toDateTHTimeZoneByYMD(year, month, day, 'floor');
}

export function timeFilterToDateTHTimeZoneCeil(date: string): Date {
  const { year, month, day } = toDateYMD(date);

  return toDateTHTimeZoneByYMD(year, month, day, 'ceil');
}

export function timeFilterToDateTHTimeZoneFloor(date: string): Date {
  const { year, month, day } = toDateYMD(date);

  return toDateTHTimeZoneByYMD(year, month, day, 'floor');
}

export function timeFilterToTwelveFormat(date: string, format: 'am' | 'pm'): [Date, Date] {
  const { year, month, day } = toDateYMD(date);

  const twelve = TIME_TWELVE_FORMAT[format];

  const dateTH = toDateTHTimeZoneByYMD(year, month, day, 'floor');

  console.info(dateTH);

  const start = new Date(new Date(dateTH).setHours(twelve.start.hours + 7, twelve.start.min));
  const end = new Date(new Date(dateTH).setHours(twelve.end.hours + 7, twelve.end.min));

  return [start, end];
}
