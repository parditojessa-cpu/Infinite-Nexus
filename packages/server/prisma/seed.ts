import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, "../uploads");

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@finitenexus.edu" },
    update: {},
    create: {
      email: "teacher@finitenexus.edu",
      passwordHash,
      mustChangePassword: false,
      role: "teacher",
      firstName: "Maria",
      lastName: "Santos",
      teacherProfile: { create: { employeeId: "T-0001", department: "Mathematics" } },
    },
  });

  const section = await prisma.section.upsert({
    where: { id: "seed-section-1" },
    update: {},
    create: {
      id: "seed-section-1",
      name: "Grade 11 - STEM A",
      gradeLevel: "Grade 11",
      strand: "STEM",
      adviserId: teacher.id,
    },
  });

  const student = await prisma.user.upsert({
    where: { studentId: "2026-00123" },
    update: {},
    create: {
      studentId: "2026-00123",
      email: "student@finitenexus.edu",
      passwordHash,
      mustChangePassword: false,
      role: "student",
      firstName: "Jess",
      lastName: "Parditio",
      studentProfile: {
        create: {
          lrn: "123456789012",
          gradeLevel: "Grade 11",
          strand: "STEM",
          sectionId: section.id,
          schoolYear: "2025-2026",
          semester: "1st Semester",
          gender: "Female",
          birthday: new Date("2009-03-14"),
          address: "Quezon City, Philippines",
          contactNumber: "+63 900 000 0000",
          parentName: "Ana Parditio",
          parentContact: "+63 900 000 0001",
        },
      },
    },
  });

  const course = await prisma.course.upsert({
    where: { id: "seed-course-1" },
    update: {},
    create: {
      id: "seed-course-1",
      title: "Finite Math 1",
      subject: "Mathematics",
      teacherId: teacher.id,
      sectionId: section.id,
      term: "Q1",
    },
  });

  await prisma.enrollment.upsert({
    where: { courseId_studentId: { courseId: course.id, studentId: student.id } },
    update: {},
    create: { courseId: course.id, studentId: student.id, progressPercent: 42 },
  });

  const module1 = await prisma.module.upsert({
    where: { id: "seed-module-1" },
    update: {},
    create: {
      id: "seed-module-1",
      courseId: course.id,
      title: "Module 1: Functions",
      orderIndex: 0,
      status: "published",
    },
  });

  const lesson1 = await prisma.lesson.upsert({
    where: { id: "seed-lesson-1" },
    update: {},
    create: {
      id: "seed-lesson-1",
      moduleId: module1.id,
      title: "Introduction to Functions",
      orderIndex: 0,
      status: "published",
      learningCompetency: "Represent real-life situations using functions",
      objectives: JSON.stringify(["Define a function", "Identify domain and range"]),
      examples: JSON.stringify(["f(x) = 2x + 1 models a delivery fee", "A vending machine as a function of coin input"]),
      lessonNotes: "A function assigns exactly one output to each input.",
      assessment: "Complete the 5-item formative check at the end of this lesson.",
      reflectionPrompt: "Where have you seen a function-like relationship in everyday life?",
      references: JSON.stringify(["DepEd General Mathematics Learner's Material, Unit 1"]),
    },
  });

  const lesson2 = await prisma.lesson.upsert({
    where: { id: "seed-lesson-2" },
    update: {},
    create: {
      id: "seed-lesson-2",
      moduleId: module1.id,
      title: "Domain and Range",
      orderIndex: 1,
      status: "published",
      learningCompetency: "Determine the domain and range of a function",
      objectives: JSON.stringify(["Identify domain restrictions", "Express domain/range in interval notation"]),
      lessonNotes: "The domain is every valid input; the range is every output the function actually produces.",
    },
  });

  await prisma.module.upsert({
    where: { id: "seed-module-2" },
    update: {},
    create: {
      id: "seed-module-2",
      courseId: course.id,
      title: "Module 2: Rational Functions",
      orderIndex: 1,
      status: "draft",
    },
  });

  await prisma.lessonProgress.upsert({
    where: { lessonId_studentId: { lessonId: lesson1.id, studentId: student.id } },
    update: {},
    create: {
      lessonId: lesson1.id,
      studentId: student.id,
      status: "done",
      bookmarked: true,
      studentNotes: "Remember: every input maps to exactly one output.",
      completedAt: new Date(),
    },
  });
  await prisma.lessonProgress.upsert({
    where: { lessonId_studentId: { lessonId: lesson2.id, studentId: student.id } },
    update: {},
    create: { lessonId: lesson2.id, studentId: student.id, status: "active" },
  });

  const resourcesDir = path.join(uploadsRoot, "lesson-resources");
  fs.mkdirSync(resourcesDir, { recursive: true });
  const exemplarPath = path.join(resourcesDir, "seed-finite-math-1-exemplar.txt");
  const lasPath = path.join(resourcesDir, "seed-finite-math-1-las.txt");
  if (!fs.existsSync(exemplarPath)) {
    fs.writeFileSync(exemplarPath, "Finite Math 1 - Lesson Exemplar (seed placeholder)\n");
  }
  if (!fs.existsSync(lasPath)) {
    fs.writeFileSync(lasPath, "Finite Math 1 - Learning Activity Sheet (seed placeholder)\n");
  }

  const exemplarAsset = await prisma.fileAsset.upsert({
    where: { id: "seed-file-exemplar" },
    update: {},
    create: {
      id: "seed-file-exemplar",
      ownerId: teacher.id,
      category: "lesson-resources",
      originalName: "Finite Math 1 - Lesson Exemplar.txt",
      storagePath: "lesson-resources/seed-finite-math-1-exemplar.txt",
      mimeType: "text/plain",
      size: fs.statSync(exemplarPath).size,
    },
  });
  const lasAsset = await prisma.fileAsset.upsert({
    where: { id: "seed-file-las" },
    update: {},
    create: {
      id: "seed-file-las",
      ownerId: teacher.id,
      category: "lesson-resources",
      originalName: "Finite Math 1 - LAS.txt",
      storagePath: "lesson-resources/seed-finite-math-1-las.txt",
      mimeType: "text/plain",
      size: fs.statSync(lasPath).size,
    },
  });

  await prisma.lessonResource.upsert({
    where: { id: "seed-resource-exemplar" },
    update: {},
    create: {
      id: "seed-resource-exemplar",
      lessonId: lesson1.id,
      type: "lesson_exemplar",
      title: "Finite Math 1 - Lesson Exemplar",
      fileAssetId: exemplarAsset.id,
      uploadedById: teacher.id,
    },
  });
  await prisma.lessonResource.upsert({
    where: { id: "seed-resource-las" },
    update: {},
    create: {
      id: "seed-resource-las",
      lessonId: lesson1.id,
      type: "las",
      title: "Finite Math 1 - LAS",
      fileAssetId: lasAsset.id,
      uploadedById: teacher.id,
    },
  });

  const thread = await prisma.discussionThread.upsert({
    where: { id: "seed-thread-1" },
    update: {},
    create: {
      id: "seed-thread-1",
      courseId: course.id,
      lessonId: lesson1.id,
      authorId: student.id,
      title: "Why does a vertical line fail the function test?",
    },
  });
  await prisma.discussionReply.upsert({
    where: { id: "seed-reply-1" },
    update: {},
    create: {
      id: "seed-reply-1",
      threadId: thread.id,
      authorId: teacher.id,
      body: "Great question — a vertical line means one input maps to infinitely many outputs, which breaks the definition of a function.",
    },
  });

  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    await prisma.attendanceRecord.upsert({
      where: { studentId_courseId_date: { studentId: student.id, courseId: course.id, date } },
      update: {},
      create: {
        studentId: student.id,
        courseId: course.id,
        date,
        status: i === 3 ? "late" : i === 7 ? "absent" : "present",
        recordedById: teacher.id,
      },
    });
  }

  const gradebookRows = [
    { id: "seed-gradebook-1", category: "quiz", score: 88, maxScore: 100 },
    { id: "seed-gradebook-2", category: "assignment", score: 92, maxScore: 100 },
    { id: "seed-gradebook-3", category: "exam", score: 79, maxScore: 100 },
  ];
  for (const row of gradebookRows) {
    await prisma.gradebookEntry.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        studentId: student.id,
        courseId: course.id,
        category: row.category,
        score: row.score,
        maxScore: row.maxScore,
        quarter: "Q1",
      },
    });
  }

  const assignment1 = await prisma.assignment.upsert({
    where: { id: "seed-assignment-1" },
    update: {},
    create: {
      id: "seed-assignment-1",
      courseId: course.id,
      title: "Piecewise Function Worksheet",
      instructions: "Complete items 1-10 on domain/range and submit as a single PDF.",
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      pointsPossible: 50,
      status: "open",
    },
  });
  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId: assignment1.id, studentId: student.id } },
    update: {},
    create: {
      assignmentId: assignment1.id,
      studentId: student.id,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      note: "Completed all items.",
      status: "graded",
      score: 46,
      feedback: "Great work — double check #7's domain restriction.",
      gradedById: teacher.id,
      gradedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  await prisma.assignment.upsert({
    where: { id: "seed-assignment-2" },
    update: {},
    create: {
      id: "seed-assignment-2",
      courseId: course.id,
      title: "Function Notation Reflection",
      instructions: "Write a short reflection (150+ words) on function notation.",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      pointsPossible: 20,
      status: "open",
    },
  });

  const quiz = await prisma.quiz.upsert({
    where: { id: "seed-quiz-1" },
    update: {},
    create: {
      id: "seed-quiz-1",
      courseId: course.id,
      lessonId: lesson1.id,
      title: "Functions Check",
      timerMinutes: 15,
      passingScore: 75,
      maxAttempts: 2,
      shuffle: false,
      status: "published",
    },
  });

  const quizQuestions: Array<{ id: string; type: string; prompt: string; options?: unknown; correctAnswer: unknown; points: number; matchingPairs?: unknown; imageUrl?: string }> = [
    {
      id: "seed-q1",
      type: "multiple_choice",
      prompt: "Which of these relations is a function?",
      options: ["{(1,2),(1,3)}", "{(1,2),(2,3)}", "{(1,2),(1,2)}", "A vertical line"],
      correctAnswer: "{(1,2),(2,3)}",
      points: 10,
    },
    {
      id: "seed-q2",
      type: "true_false",
      prompt: "Every function is also a relation.",
      options: ["True", "False"],
      correctAnswer: "True",
      points: 5,
    },
    {
      id: "seed-q3",
      type: "identification",
      prompt: "What do we call the set of all valid inputs of a function?",
      correctAnswer: "Domain",
      points: 10,
    },
    {
      id: "seed-q4",
      type: "checkbox",
      prompt: "Select all statements that are true of functions.",
      options: ["Each input maps to exactly one output", "Inputs can repeat", "Outputs can repeat", "A vertical line is a function"],
      correctAnswer: ["Each input maps to exactly one output", "Outputs can repeat"],
      points: 10,
    },
    {
      id: "seed-q5",
      type: "short_answer",
      prompt: "Give one real-world example of a function.",
      correctAnswer: "vending machine",
      points: 5,
    },
    {
      id: "seed-q6",
      type: "matching",
      prompt: "Match each term to its definition.",
      matchingPairs: { Domain: "Set of inputs", Range: "Set of outputs", Function: "One output per input" },
      correctAnswer: { Domain: "Set of inputs", Range: "Set of outputs", Function: "One output per input" },
      points: 15,
    },
    {
      id: "seed-q7",
      type: "essay",
      prompt: "Explain in your own words why the vertical line test works.",
      correctAnswer: null,
      points: 15,
    },
    {
      id: "seed-q8",
      type: "image_question",
      prompt: "Does the graph shown represent a function?",
      options: ["Yes", "No"],
      correctAnswer: "Yes",
      points: 10,
      imageUrl: "/icons/finite-nexus-logo.png",
    },
  ];
  for (let i = 0; i < quizQuestions.length; i++) {
    const q = quizQuestions[i];
    await prisma.quizQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        quizId: quiz.id,
        orderIndex: i,
        type: q.type,
        prompt: q.prompt,
        options: q.options ? JSON.stringify(q.options) : null,
        correctAnswer: q.correctAnswer !== undefined ? JSON.stringify(q.correctAnswer) : null,
        points: q.points,
        matchingPairs: q.matchingPairs ? JSON.stringify(q.matchingPairs) : null,
        imageUrl: q.imageUrl ?? null,
      },
    });
  }

  const badgeDefs = [
    { id: "seed-badge-1", name: "First Steps", description: "Complete your first lesson", icon: "🥇" },
    { id: "seed-badge-2", name: "Quiz Whiz", description: "Score 100% on a quiz", icon: "🎯" },
    { id: "seed-badge-3", name: "Streak Keeper", description: "Log in 5 days in a row", icon: "🔥" },
    { id: "seed-badge-4", name: "Discussion Star", description: "Post 10 discussion replies", icon: "💬" },
    { id: "seed-badge-5", name: "Perfect Attendance", description: "No absences in a quarter", icon: "🗓️" },
    { id: "seed-badge-6", name: "Honor Roll", description: "Maintain a 90+ average", icon: "🏆" },
  ];
  for (const b of badgeDefs) {
    await prisma.badge.upsert({ where: { id: b.id }, update: {}, create: b });
  }
  await prisma.studentBadge.upsert({
    where: { studentId_badgeId: { studentId: student.id, badgeId: "seed-badge-1" } },
    update: {},
    create: { studentId: student.id, badgeId: "seed-badge-1" },
  });

  await prisma.interventionProfile.upsert({
    where: { studentId: student.id },
    update: {},
    create: {
      studentId: student.id,
      riskTier: "satisfactory",
      interventionStatus: "no_intervention_required",
    },
  });

  await prisma.studentLevel.upsert({
    where: { studentId: student.id },
    update: {},
    create: { studentId: student.id, currentLevel: 2, currentXp: 210 },
  });

  const classmates = [
    { id: "seed-student-2", firstName: "Miguel", lastName: "Reyes", xp: 340, level: 3, riskTier: "excellent", average: 94, attendanceRate: 98 },
    { id: "seed-student-3", firstName: "Andrea", lastName: "Cruz", xp: 160, level: 2, riskTier: "needs_monitoring", average: 74, attendanceRate: 82 },
    { id: "seed-student-4", firstName: "Paolo", lastName: "Villanueva", xp: 60, level: 1, riskTier: "at_risk", average: 58, attendanceRate: 68 },
  ];
  for (const c of classmates) {
    const classmate = await prisma.user.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        studentId: `2026-00${c.id.slice(-3)}`,
        passwordHash,
        mustChangePassword: false,
        role: "student",
        firstName: c.firstName,
        lastName: c.lastName,
        studentProfile: {
          create: {
            gradeLevel: "Grade 11",
            strand: "STEM",
            sectionId: section.id,
            schoolYear: "2025-2026",
            semester: "1st Semester",
          },
        },
      },
    });
    await prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId: course.id, studentId: classmate.id } },
      update: {},
      create: { courseId: course.id, studentId: classmate.id, progressPercent: c.average },
    });
    await prisma.gradebookEntry.upsert({
      where: { id: `${c.id}-grade` },
      update: {},
      create: {
        id: `${c.id}-grade`,
        studentId: classmate.id,
        courseId: course.id,
        category: "quiz",
        score: c.average,
        maxScore: 100,
        quarter: "Q1",
      },
    });
    const attDate = new Date();
    attDate.setHours(0, 0, 0, 0);
    await prisma.attendanceRecord.upsert({
      where: { studentId_courseId_date: { studentId: classmate.id, courseId: course.id, date: attDate } },
      update: {},
      create: {
        studentId: classmate.id,
        courseId: course.id,
        date: attDate,
        status: c.attendanceRate >= 90 ? "present" : c.attendanceRate >= 75 ? "late" : "absent",
        recordedById: teacher.id,
      },
    });
    await prisma.studentLevel.upsert({
      where: { studentId: classmate.id },
      update: {},
      create: { studentId: classmate.id, currentLevel: c.level, currentXp: c.xp },
    });
    await prisma.interventionProfile.upsert({
      where: { studentId: classmate.id },
      update: {},
      create: {
        studentId: classmate.id,
        riskTier: c.riskTier,
        interventionStatus: c.riskTier === "at_risk" ? "under_monitoring" : "no_intervention_required",
      },
    });
  }

  await prisma.announcement.upsert({
    where: { id: "seed-announcement-1" },
    update: {},
    create: {
      id: "seed-announcement-1",
      authorId: teacher.id,
      courseId: course.id,
      title: "Welcome to Finite Math 1",
      body: "Please review Module 1 before our next class.",
    },
  });

  console.log("Seed complete.");
  console.log("Teacher login: teacher@finitenexus.edu / password123");
  console.log("Student login: 2026-00123 (or student@finitenexus.edu) / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
