import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function pageOf(value: string | undefined, size = 20) {
  const page = Math.max(1, Number(value) || 1);
  return { page, size, offset: (page - 1) * size };
}
