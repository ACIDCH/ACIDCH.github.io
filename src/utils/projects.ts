export type ProjectFilters = {
  tool?: string;
  topic?: string;
  status?: string;
};

export type FilterableProject = {
  tools: string[];
  topic: string;
  status: string;
};

export function matchesProjectFilters(
  project: FilterableProject,
  filters: ProjectFilters,
): boolean {
  const normalisedTools = project.tools.map((tool) => tool.toLocaleLowerCase());
  const selectedTool = filters.tool?.toLocaleLowerCase();

  return (
    (!selectedTool || normalisedTools.includes(selectedTool)) &&
    (!filters.topic || project.topic === filters.topic) &&
    (!filters.status || project.status === filters.status)
  );
}
