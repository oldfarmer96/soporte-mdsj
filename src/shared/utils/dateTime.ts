export const LIMA_TIME_ZONE = "America/Lima";

export type DateTimeValue = string | number | Date | null | undefined;

export type LimaDateTimeFormat = "date" | "time" | "dateTime";

export interface LimaDateTimeParts {
  date: string;
  time: string;
  dateTime: string;
  iso: string | null;
}

const UNAVAILABLE_DATE = "No disponible";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: LIMA_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: LIMA_TIME_ZONE,
});

const parseDate = (value: DateTimeValue): Date | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const getLimaDateTimeParts = (
  value: DateTimeValue,
): LimaDateTimeParts => {
  const date = parseDate(value);

  if (!date) {
    return {
      date: UNAVAILABLE_DATE,
      time: UNAVAILABLE_DATE,
      dateTime: UNAVAILABLE_DATE,
      iso: null,
    };
  }

  const formattedDate = dateFormatter.format(date);
  const formattedTime = timeFormatter.format(date);

  return {
    date: formattedDate,
    time: formattedTime,
    dateTime: `${formattedDate} - ${formattedTime}`,
    iso: date.toISOString(),
  };
};

export const formatLimaDateTime = (
  value: DateTimeValue,
  format: LimaDateTimeFormat = "dateTime",
): string => {
  return getLimaDateTimeParts(value)[format];
};