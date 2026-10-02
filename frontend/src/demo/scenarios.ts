export const DEMO_SCENARIOS = [
  {
    id: "standard",
    label: "Standard",
    description: "Four simulated analysts, four tasks, eight illustrative reports, and one failed run."
  },
  {
    id: "offline",
    label: "Offline analysts",
    description: "The same saved demo records with all analysts marked offline."
  },
  {
    id: "empty-reports",
    label: "No reports",
    description: "A deliberate empty state with no reports or run history."
  },
  {
    id: "run-fails",
    label: "Next run fails",
    description: "A requested demo run ends as failed and creates no report."
  }
] as const;

export type DemoScenario = (typeof DEMO_SCENARIOS)[number]["id"];

export function isDemoScenario(value: unknown): value is DemoScenario {
  return DEMO_SCENARIOS.some((scenario) => scenario.id === value);
}

export function getDemoScenarioInfo(scenario: DemoScenario) {
  return DEMO_SCENARIOS.find((candidate) => candidate.id === scenario)!;
}
