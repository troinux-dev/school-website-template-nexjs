import { fmtLong } from "./dates";

export function admissionsClosedLabel(year: number, openDate: string | null) {
  return `Admissions for ${year} open on ${openDate ? fmtLong(openDate) : "a date to be announced"}`;
}
