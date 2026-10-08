import type { Role, Scope } from "./policy";

export type ScopeTarget = { grade?: string; classId?: string; subjectId?: string };
export type ScopedIdentity = { role: Role; scope?: Scope };

const REQUIRE_EXPLICIT_SCOPE = new Set<Role>(["teacher", "counselor"]);

export function hasExplicitScope(scope: Scope | undefined): boolean {
  return Boolean(scope?.grades?.length || scope?.classIds?.length || scope?.subjectIds?.length);
}

export function accessAllows(identity: ScopedIdentity, target: ScopeTarget): boolean {
  const scope = identity.scope ?? {};
  const explicit = hasExplicitScope(scope);
  if (REQUIRE_EXPLICIT_SCOPE.has(identity.role) && !explicit) return false;
  if (!explicit) return true;

  if (scope.grades?.length && (!target.grade || !scope.grades.includes(target.grade))) return false;
  if (scope.classIds?.length && (!target.classId || !scope.classIds.includes(target.classId))) return false;
  if (scope.subjectIds?.length && (!target.subjectId || !scope.subjectIds.includes(target.subjectId))) return false;
  return true;
}

export function filterByScope<T>(identity: ScopedIdentity, rows: T[], target: (row: T) => ScopeTarget): T[] {
  return rows.filter((row) => accessAllows(identity, target(row)));
}
