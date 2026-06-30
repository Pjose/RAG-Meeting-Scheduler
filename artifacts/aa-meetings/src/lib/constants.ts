export const PERSON_ROLES = ["Admin", "Coordinator", "Member", "Guest"];

export const MEETING_TYPES = ["Open", "Closed", "Blended", "Other"];

export const MEETING_FORMATS = [
  "Beginner/Foundation",
  "Book Study",
  "Call-Up",
  "Discussion",
  "Prayer & Meditation",
  "Speaker",
  "Step/Tradition Study",
  "Other",
];

export const MEETING_MODES = ["In-Person", "Online", "Hybrid", "Other"];

export const LITERATURE = [
  "12 & 12",
  "A.A. Comes Of Age",
  "A.A. In Prison: Inmate To Inmate",
  "Alcoholics Anonymous(Big Book)",
  "As Bill Sees It",
  "Plain Language Big Book",
  "Came To Believe...",
  "Daily Reflections",
  "Dr. Bob And The Good Oldtimers",
  "Experience, Strength And Hope",
  "Grapevine/La Vina",
  "Living Sober",
  "Our Great Responsibility",
  "Pass It On",
  "Other",
];

export const ASSIGNMENT_ROLES = [
  "Chairperson",
  "Co-Chairperson",
  "Secretary",
  "Treasurer",
  "GSR",
  "Intergroup",
  "PI",
  "H&I",
  "Communication",
  "Unity",
  "Meeting Co-Chair",
  "Alternate GSR",
  "Alternate Treasurer",
  "Alternate Intergroup",
  "Assistant Communication",
];

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const LANGUAGES = ["English", "Spanish", "French", "Portuguese", "Other"];

export const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
