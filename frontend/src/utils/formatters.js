import { format } from "date-fns";

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "dd MMM yyyy, hh:mm a");
  } catch {
    return "-";
  }
}

export function toTitleCase(text = "") {
  return text
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}
