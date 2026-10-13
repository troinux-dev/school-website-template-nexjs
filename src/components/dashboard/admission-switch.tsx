import { setAdmissionPeriod } from "@/app/dashboard/_actions/admissions";
import { cn } from "@/lib/utils";

/** DB-02.1 / DB-07.1 — role="switch" with aria-checked; works without JavaScript. */
export function AdmissionSwitch({ on, back }: { on: boolean; back: string }) {
  return (
    <form action={setAdmissionPeriod} className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <input type="hidden" name="back" value={back} />
      <button
        type="submit"
        role="switch"
        aria-checked={on}
        aria-describedby="admission-status"
        className="inline-flex min-h-12 items-center gap-3 rounded-xl pr-2 font-semibold"
      >
        <span className={cn("relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors", on ? "bg-green-700" : "bg-slate-400")}>
          <span className={cn("absolute size-6 rounded-full bg-white shadow transition-transform", on ? "translate-x-7" : "translate-x-1")} />
        </span>
        Admission period
      </button>
      <div id="admission-status">
        <p className={cn("font-semibold", on ? "text-green-800" : "text-slate-800")}>{on ? "Open" : "Closed"}</p>
        <p className="text-sm text-slate-700">
          {on
            ? "Apply Now shows in the header, menu, Home hero and About banner, and the enquiry form is live."
            : "Apply Now is hidden everywhere; visitors see the opening date and “Book a campus tour”."}
        </p>
      </div>
    </form>
  );
}
