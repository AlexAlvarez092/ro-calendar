import ical, { ICalCalendar } from "ical-generator";
import type { AppConfig } from "../config/config.js";
import type { CalendarEvent } from "../domain/calendar-event.js";

export function generateCalendarIcs(
  events: CalendarEvent[],
  config: AppConfig,
): string {
  const calendar: ICalCalendar = ical({
    name: `${config.team.name} Fixtures`,
    timezone: config.timezone,
    prodId: {
      company: "ro-calendar",
      product: "real-oviedo-calendar",
    },
  });

  for (const event of events) {
    calendar.createEvent({
      id: event.uid,
      start: event.start,
      allDay: event.allDay,
      summary: event.title,
      location: event.location,
      description: event.description,
      timezone: config.timezone,
    });
  }

  return calendar.toString();
}
