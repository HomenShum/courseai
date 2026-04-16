export async function requireOperator(ctx: any, operatorId: string) {
  const operator = await ctx.db
    .query("users")
    .withIndex("by_operatorId", (q: any) => q.eq("operatorId", operatorId))
    .first();

  if (!operator) {
    throw new Error("Operator session is missing or invalid.");
  }

  return operator;
}

export async function requireProgramAccess(ctx: any, operatorId: string, programId: string) {
  const operator = await requireOperator(ctx, operatorId);

  if (operator.role === "department_chair") {
    const program = await ctx.db
      .query("programs")
      .withIndex("by_programId", (q: any) => q.eq("programId", programId))
      .first();
    if (!program || !operator.campusIds.some((c: string) => c === program.campus || c === "ALL")) {
      throw new Error(`Operator ${operator.name} cannot access program ${programId}.`);
    }
    return operator;
  }

  if (!operator.programIds.includes(programId)) {
    throw new Error(`Operator ${operator.name} cannot access program ${programId}.`);
  }

  return operator;
}

export async function requireCampusAccess(ctx: any, operatorId: string, campusId: string) {
  const operator = await requireOperator(ctx, operatorId);
  if (operator.role !== "department_chair" && operator.role !== "academic_advisor") {
    if (!operator.campusIds.includes(campusId) && !operator.campusIds.includes("ALL")) {
      throw new Error(`Operator ${operator.name} cannot access campus ${campusId}.`);
    }
  }
  return operator;
}

export async function requireCourseAccess(ctx: any, operatorId: string, courseId: string) {
  const course = await ctx.db
    .query("courses")
    .withIndex("by_courseId", (q: any) => q.eq("courseId", courseId))
    .first();

  if (!course) {
    throw new Error(`Course ${courseId} not found.`);
  }

  await requireProgramAccess(ctx, operatorId, course.programId);

  return course;
}
