export function buildICS(options: {
  title: string;
  description?: string;
  dateISO: string; // yyyy-MM-dd
  startHHMM: string;
  endHHMM: string;
}): string {
  const { title, description, dateISO, startHHMM, endHHMM } = options;
  const dtStart = dateISO.replace(/-/g, '') + 'T' + startHHMM.replace(':', '') + '00';
  const dtEnd = dateISO.replace(/-/g, '') + 'T' + endHHMM.replace(':', '') + '00';
  const uid = `${Date.now()}@agentic-scheduler`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agentic Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStart}Z`,
    `DTSTART:${dtStart}Z`,
    `DTEND:${dtEnd}Z`,
    `SUMMARY:${escapeICS(title)}`,
    description ? `DESCRIPTION:${escapeICS(description)}` : undefined,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\n');
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}
