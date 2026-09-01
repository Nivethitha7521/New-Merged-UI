import type {
  DisplaySettings,
} from '@/contexts/DisplaySettingsContext';


const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];


const buildDate = (
  day: string,
  month: string,
  year: string,
  format: DisplaySettings['dateFormat']
) => {
  const monthName =
    MONTHS[Number(month) - 1] || month;

  switch (format) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;

    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;

    case 'DD MMM YYYY':
      return `${day} ${monthName} ${year}`;

    case 'MMM DD, YYYY':
      return `${monthName} ${day}, ${year}`;

    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
};


export const formatDateTime = (
  value: string | Date | null | undefined,
  settings: DisplaySettings
) => {
  if (!value) return '-';

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const dateParts =
    new Intl.DateTimeFormat('en-US', {
      timeZone: settings.timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(date);

  const getPart = (type: string) =>
    dateParts.find(
      (part) => part.type === type
    )?.value || '';

  const formattedDate = buildDate(
    getPart('day'),
    getPart('month'),
    getPart('year'),
    settings.dateFormat
  );

  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: settings.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: settings.timeFormat === '12h',
  };

  if (settings.showSeconds) {
    timeOptions.second = '2-digit';
  }

  const formattedTime =
    new Intl.DateTimeFormat(
      'en-US',
      timeOptions
    ).format(date);

  return `${formattedDate} ${formattedTime}`;
};