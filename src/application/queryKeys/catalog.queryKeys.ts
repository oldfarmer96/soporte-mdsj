interface ProblemTypeKeyOptions {
  categoryId?: string;
  includeInactive: boolean;
}

interface SubareaKeyOptions {
  areaId?: string;
  includeInactive: boolean;
}

export const catalogKeys = {
  all: ["catalogs"] as const,
  areas: (includeInactive: boolean) =>
    [...catalogKeys.all, "areas", { includeInactive }] as const,
  subareas: ({ areaId, includeInactive }: SubareaKeyOptions) =>
    [
      ...catalogKeys.all,
      "subareas",
      { areaId: areaId ?? "all", includeInactive },
    ] as const,
  categories: (includeInactive: boolean) =>
    [...catalogKeys.all, "categories", { includeInactive }] as const,
  problemTypes: ({ categoryId, includeInactive }: ProblemTypeKeyOptions) =>
    [
      ...catalogKeys.all,
      "problem-types",
      { categoryId: categoryId ?? "all", includeInactive },
    ] as const,
};
