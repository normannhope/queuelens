// What kind of thing a hub is actually counting. This exists because the
// original prompt only described "people in a line," which works for a
// counter or entrance but silently fails for a car queue (a ferry terminal,
// a drive-thru, a toll booth) — visually a completely different scene, and
// the model needs to be told to look for vehicles instead of people, with
// its own count-to-level scale and its own wording in summaries.
export type Subject = "PEOPLE" | "VEHICLES" | "CUSTOM";

export const SUBJECTS: Record<Subject, { label: string; unit: string; hint: string }> = {
  PEOPLE: {
    label: "People queue",
    unit: "people",
    hint: "A line or crowd of people — counter, entrance, waiting room.",
  },
  VEHICLES: {
    label: "Vehicle queue",
    unit: "cars",
    hint: "Cars, trucks or other vehicles queuing — ferry, toll booth, drive-thru, car wash.",
  },
  CUSTOM: {
    label: "Custom",
    unit: "",
    hint: "Anything else — describe exactly what to count in the instructions field.",
  },
};
