import * as nodeIcal from "node-ical";
import type { CalendarEvent } from "../domain/calendar-event.js";

interface EventBlock {
  uid: string | null;
  dtstart: string | null;
  summary: string | null;
}

export function validateCalendarIcs(
  ics: string,
  sourceEvents: CalendarEvent[],
): void {
  if (!ics.includes("BEGIN:VCALENDAR") || !ics.includes("END:VCALENDAR")) {
    throw new Error("ICS document is missing calendar boundaries.");
  }

  nodeIcal.sync.parseICS(ics);

  const blocks = readEventBlocks(ics);
  const seen = new Set<string>();
  const sourceByUid = new Map(sourceEvents.map((event) => [event.uid, event]));

  if (blocks.length === 0) {
    throw new Error("ICS document does not contain any VEVENT entries.");
  }

  if (blocks.length !== sourceEvents.length) {
    throw new Error("ICS VEVENT count does not match source event count.");
  }

  for (const block of blocks) {
    if (!block.uid || !block.summary || !block.dtstart) {
      throw new Error("ICS event missing UID, SUMMARY or DTSTART.");
    }

    if (seen.has(block.uid)) {
      throw new Error(`Duplicate UID detected: ${block.uid}`);
    }

    seen.add(block.uid);

    const source = sourceByUid.get(block.uid);

    if (!source) {
      throw new Error(`ICS UID not present in source events: ${block.uid}`);
    }

    if (source.allDay) {
      if (!block.dtstart.includes(";VALUE=DATE:")) {
        throw new Error(`All-day event does not use DATE format: ${block.uid}`);
      }

      if (/:[0-9]{8}T/.test(block.dtstart)) {
        throw new Error(
          `All-day event contains an invented time: ${block.uid}`,
        );
      }
    } else if (!/:[0-9]{8}T/.test(block.dtstart)) {
      throw new Error(
        `Timed event does not include time component: ${block.uid}`,
      );
    }
  }
}

function readEventBlocks(ics: string): EventBlock[] {
  const parts = ics.split("BEGIN:VEVENT").slice(1);

  return parts.map((part) => {
    const body = part.split("END:VEVENT")[0] ?? "";
    const lines = body.split(/\r?\n/);

    const uid = extractField(lines, "UID:");
    const summary = extractField(lines, "SUMMARY:");

    const dtstartLine =
      lines.find((line) => line.startsWith("DTSTART")) ?? null;

    return {
      uid,
      summary,
      dtstart: dtstartLine,
    };
  });
}

function extractField(lines: string[], prefix: string): string | null {
  const line = lines.find((candidate) => candidate.startsWith(prefix));
  return line ? line.slice(prefix.length) : null;
}
