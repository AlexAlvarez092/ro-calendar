export interface CalendarEvent {
  uid: string;
  title: string;
  start: Date;
  allDay: boolean;
  location?: string;
  description: string;
}
