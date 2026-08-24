import ical, { ICalCalendar } from "ical-generator";
import { DateTime } from "luxon";
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
    // ical-generator reads plain Date objects using the host process's local
    // timezone getters when a `timezone` is set, instead of converting to it.
    // Passing zoned Luxon DateTime values keeps the correct local time
    // regardless of the timezone the pipeline actually runs in.
    const start = toZonedDateTime(event.start, config.timezone);
    const end = event.end
      ? toZonedDateTime(event.end, config.timezone)
      : undefined;

    calendar.createEvent({
      id: event.uid,
      start,
      end,
      allDay: event.allDay,
      summary: event.title,
      location: event.location,
      description: event.description,
      timezone: config.timezone,
    });
  }

  return calendar.toString();
}

function toZonedDateTime(date: Date, timezone: string): DateTime {
  return DateTime.fromJSDate(date).setZone(timezone);
}
