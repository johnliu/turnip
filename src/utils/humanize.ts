import humanizeDuration from 'humanize-duration';

const humanizer = humanizeDuration.humanizer();
humanizer.languages['en-short'] = {
  y: () => 'y',
  mo: () => 'mo',
  w: () => 'w',
  d: () => 'd',
  h: () => 'h',
  m: () => 'm',
  s: () => 's',
  ms: () => 'ms',
};

export function duration(ms: number) {
  return humanizer(ms, {
    language: 'en',
    units: ['h', 'm'],
    round: true,
  });
}

export function durationShort(ms: number) {
  return humanizer(ms, {
    language: 'en-short',
    spacer: '',
    conjunction: ' ',
    serialComma: false,
    units: ['h', 'm'],
    round: true,
  });
}
