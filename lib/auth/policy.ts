export type Role =
  | "super_admin"
  | "school_admin"
  | "principal"
  | "coordinator"
  | "teacher"
  | "counselor"
  | "it_admin"
  | "student"
  | "parent";

export type Action =
  | "school:read"
  | "command:read"
  | "academics:read"
  | "academics:write"
  | "attendance:read"
  | "operations:read"
  | "operations:write"
  | "meeting:write"
  | "reports:read"
  | "student:read"
  | "student:sensitive-read"
  | "assessment:write"
  | "attendance:write"
  | "intervention:read"
  | "intervention:write"
  | "intervention:close"
  | "vision:read"
  | "vision:review"
  | "import:write"
  | "audit:read"
  | "settings:write"
  | "self:read"
  | "dependent:read";

const full: Action[] = [
  "school:read",
  "command:read",
  "academics:read",
  "academics:write",
  "attendance:read",
  "operations:read",
  "operations:write",
  "meeting:write",
  "reports:read",
  "student:read",
  "student:sensitive-read",
  "assessment:write",
  "attendance:write",
  "intervention:read",
  "intervention:write",
  "intervention:close",
  "vision:read",
  "vision:review",
  "import:write",
  "audit:read",
  "settings:write",
];

const permissions: Record<Role, ReadonlySet<Action>> = {
  super_admin: new Set(full),
  school_admin: new Set(full),
  principal: new Set([
    "school:read",
    "command:read",
    "academics:read",
    "academics:write",
    "attendance:read",
    "operations:read",
    "operations:write",
    "meeting:write",
    "reports:read",
    "student:read",
    "student:sensitive-read",
    "intervention:read",
    "intervention:write",
    "intervention:close",
    "vision:read",
    "vision:review",
    "audit:read",
  ]),
  coordinator: new Set([
    "school:read",
    "command:read",
    "academics:read",
    "academics:write",
    "attendance:read",
    "operations:read",
    "operations:write",
    "meeting:write",
    "reports:read",
    "student:read",
    "student:sensitive-read",
    "assessment:write",
    "attendance:write",
    "intervention:read",
    "intervention:write",
    "intervention:close",
  ]),
  teacher: new Set([
    "school:read",
    "academics:read",
    "academics:write",
    "attendance:read",
    "operations:read",
    "meeting:write",
    "student:read",
    "assessment:write",
    "attendance:write",
    "intervention:read",
    "intervention:write",
  ]),
  counselor: new Set([
    "school:read",
    "attendance:read",
    "student:read",
    "student:sensitive-read",
    "intervention:read",
    "intervention:write",
    "intervention:close",
  ]),
  it_admin: new Set([
    "school:read",
    "operations:read",
    "operations:write",
    "import:write",
    "audit:read",
    "settings:write",
    "vision:read",
  ]),
  student: new Set(["school:read", "self:read"]),
  parent: new Set(["school:read", "dependent:read"]),
};

export function can(role: Role, action: Action): boolean {
  return permissions[role].has(action);
}

export function assertCan(role: Role, action: Action): void {
  if (!can(role, action)) throw new Error(`Forbidden: ${role} cannot ${action}`);
}

export type Scope = { grades?: string[]; classIds?: string[]; subjectIds?: string[] };

export function scopeAllows(
  scope: Scope | undefined,
  target: { grade?: string; classId?: string; subjectId?: string },
): boolean {
  if (!scope) return true;
  if (scope.grades?.length && target.grade && !scope.grades.includes(target.grade)) return false;
  if (scope.classIds?.length && target.classId && !scope.classIds.includes(target.classId)) return false;
  if (scope.subjectIds?.length && target.subjectId && !scope.subjectIds.includes(target.subjectId)) return false;
  return true;
}
