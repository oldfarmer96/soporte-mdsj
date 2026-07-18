interface ProblemTypeKeyOptions {
  categoryId?: string;
  includeInactive: boolean;
}

export const catalogKeys = {
  all: ["catalogs"] as const,
  areas: (includeInactive: boolean) =>
    [...catalogKeys.all, "areas", { includeInactive }] as const,
  categories: (includeInactive: boolean) =>
    [...catalogKeys.all, "categories", { includeInactive }] as const,
  problemTypes: ({ categoryId, includeInactive }: ProblemTypeKeyOptions) =>
    [
      ...catalogKeys.all,
      "problem-types",
      { categoryId: categoryId ?? "all", includeInactive },
    ] as const,
};
