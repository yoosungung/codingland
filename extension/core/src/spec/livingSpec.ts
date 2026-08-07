/** ARCHITECTURE §4.4 Living Spec — BDD scenarios keyed by scenarioId. */

export interface LivingSpecArtifact {
  path: string;
  fingerprints: string[];
  scenarios: Array<{
    scenarioId: string;
    bdd: string;
    jestPath?: string;
  }>;
  consensusAt: string;
}

interface FrontmatterScenario {
  scenarioId: string;
  bdd: string;
  jestPath?: string;
}

interface Frontmatter {
  fingerprints?: string[];
  scenarios?: FrontmatterScenario[];
  consensusAt?: string;
}

/**
 * Parse a `.codingland.md` sidecar. Expects YAML-ish frontmatter between `---`.
 * Minimal parser (no full YAML dep): fingerprints list + scenarios with scenarioId/bdd.
 */
export function parseLivingSpec(
  path: string,
  markdown: string
): LivingSpecArtifact {
  const fm = extractFrontmatter(markdown);
  return {
    path,
    fingerprints: fm.fingerprints ?? [],
    scenarios: (fm.scenarios ?? []).map((s) => ({
      scenarioId: s.scenarioId,
      bdd: s.bdd.trim(),
      jestPath: s.jestPath,
    })),
    consensusAt: fm.consensusAt ?? "",
  };
}

export function linkJestStub(
  artifact: LivingSpecArtifact,
  scenarioId: string,
  jestPath: string
): LivingSpecArtifact {
  const idx = artifact.scenarios.findIndex((s) => s.scenarioId === scenarioId);
  if (idx < 0) {
    throw new Error(`unknown scenarioId: ${scenarioId}`);
  }
  const scenarios = artifact.scenarios.map((s, i) =>
    i === idx ? { ...s, jestPath } : { ...s }
  );
  return {
    ...artifact,
    scenarios,
  };
}

function extractFrontmatter(markdown: string): Frontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if (!match) {
    return {};
  }
  return parseSimpleYaml(match[1]);
}

/** Tiny subset parser for Living Spec frontmatter used in tests/fixtures. */
function parseSimpleYaml(src: string): Frontmatter {
  const lines = src.split(/\r?\n/);
  const result: Frontmatter = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^fingerprints:\s*$/.test(line)) {
      const list: string[] = [];
      i += 1;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        list.push(lines[i].replace(/^\s+-\s+/, "").trim());
        i += 1;
      }
      result.fingerprints = list;
      continue;
    }
    if (/^scenarios:\s*$/.test(line)) {
      const scenarios: FrontmatterScenario[] = [];
      i += 1;
      while (i < lines.length && /^\s+-\s+scenarioId:/.test(lines[i])) {
        const scenarioId = lines[i].replace(/^\s+-\s+scenarioId:\s*/, "").trim();
        i += 1;
        let bdd = "";
        let jestPath: string | undefined;
        while (
          i < lines.length &&
          /^\s+/.test(lines[i]) &&
          !/^\s+-\s+scenarioId:/.test(lines[i])
        ) {
          const l = lines[i];
          if (/^\s+bdd:\s*\|/.test(l)) {
            i += 1;
            const block: string[] = [];
            while (i < lines.length && /^\s{4,}/.test(lines[i])) {
              block.push(lines[i].replace(/^\s{4}/, ""));
              i += 1;
            }
            bdd = block.join("\n");
            continue;
          }
          if (/^\s+bdd:\s*/.test(l)) {
            bdd = l.replace(/^\s+bdd:\s*/, "").trim();
            i += 1;
            continue;
          }
          if (/^\s+jestPath:\s*/.test(l)) {
            jestPath = l.replace(/^\s+jestPath:\s*/, "").trim();
            i += 1;
            continue;
          }
          i += 1;
        }
        scenarios.push({ scenarioId, bdd, jestPath });
      }
      result.scenarios = scenarios;
      continue;
    }
    if (/^consensusAt:\s*/.test(line)) {
      result.consensusAt = line.replace(/^consensusAt:\s*/, "").trim();
      i += 1;
      continue;
    }
    i += 1;
  }
  return result;
}
