import { profileKeys } from "@/application/queryKeys/profile.queryKeys";
import type { ProfileListFilters } from "@/shared/interfaces/profile.interface";
import { getProfiles } from "@/services/profile.service";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useProfiles = (filters: ProfileListFilters) =>
  useQuery({
    queryKey: profileKeys.list(filters),
    queryFn: () => getProfiles(filters),
    placeholderData: keepPreviousData,
    retry: 2,
  });
