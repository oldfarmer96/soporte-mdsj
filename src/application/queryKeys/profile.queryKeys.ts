import type { ProfileListFilters } from "@/shared/interfaces/profile.interface";

export const profileKeys = {
  all: ["profiles"] as const,
  lists: () => [...profileKeys.all, "list"] as const,
  list: (filters: ProfileListFilters) => [...profileKeys.lists(), filters] as const,
};
