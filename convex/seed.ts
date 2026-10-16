import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { appError } from "./lib/errors";
import { allocateLoginCode } from "./lib/loginCodes";
import { turnInCloseFor, zonedTimeToUtc } from "./lib/time";

/**
 * Loads the sample school from the CodeCS design into an EMPTY development
 * deployment: curricula, days, the 2026–27 schedule, assignments, a basic
 * roster with seats, sample work for Jordan Smith, a review queue and help
 * requests. Create an admin first (admins:createAdmin); it authors feedback.
 *
 *   npx convex run seed:run
 *
 * Never run this against production.
 */

const TIME_ZONE = "America/Los_Angeles";
const SETTINGS = {
  currentYear: "2026-27",
  turnInDays: 14,
  closeTime: "23:59",
  timeZone: TIME_ZONE,
};

/** Wall-clock Pacific time to UTC ms. */
function pt(year: number, month: number, day: number, hour = 16, minute = 0): number {
  return zonedTimeToUtc({ year, month, day, hour, minute }, TIME_ZONE);
}

type PartKind = Doc<"assignmentRevisions">["parts"][number]["kind"];
type AssignmentSeed = {
  title: string;
  type: "guided" | "open";
  status?: "draft" | "published";
  summary: string;
  instructions: string;
  expectedOutput?: string;
  starter?: string;
  parts?: Array<[name: string, kind: PartKind, expected: string]>;
  partialMin?: number;
  loopCheck?: boolean;
  checkInput?: string;
};

type DaySeed = {
  topic: string;
  date?: [number, number, number];
  slidesUrl?: string;
  assignments: AssignmentSeed[];
};

const FUNDAMENTALS: DaySeed[] = [
  {
    topic: "Hello, Python",
    date: [2026, 9, 17],
    assignments: [
      {
        title: "Hello, world",
        type: "guided",
        summary: "Print your first message.",
        instructions: "Print exactly: Hello, world!",
        expectedOutput: "Hello, world!",
        parts: [["Prints the greeting", "equals", "Hello, world!"]],
        partialMin: 1,
      },
      {
        title: "Say it twice",
        type: "guided",
        summary: "Print the same line two times.",
        instructions: "Print Python is fun! on two lines.",
        expectedOutput: "Python is fun!\nPython is fun!",
        parts: [
          ["First line", "begins", "Python is fun!"],
          ["Second line", "equals", "Python is fun!\nPython is fun!"],
        ],
        partialMin: 1,
      },
    ],
  },
  {
    topic: "Variables",
    date: [2026, 9, 24],
    assignments: [
      {
        title: "Name tag",
        type: "guided",
        summary: "Store your name and age, then print a name tag.",
        instructions: "Make variables for a name and an age, then print: Hi, I'm <name> and I'm <age>.",
        expectedOutput: "Hi, I'm Jordan and I'm 12.",
        starter: 'name = "Jordan"\nage = 12\n',
        parts: [["Prints the name tag", "containsInOrder", "Hi, I'm and I'm"]],
        partialMin: 1,
      },
      {
        title: "Swap two values",
        type: "guided",
        summary: "Swap the values of a and b.",
        instructions: "Start with a = 1 and b = 2. Swap them, then print a and b.",
        expectedOutput: "2\n1",
        parts: [["Prints the swapped values", "equals", "2\n1"]],
        partialMin: 1,
      },
      {
        title: "Rectangle area",
        type: "guided",
        summary: "Compute the area of a rectangle.",
        instructions: "Use width = 7 and height = 3. Print the area.",
        expectedOutput: "21",
        parts: [["Prints the area", "equals", "21"]],
        partialMin: 1,
      },
    ],
  },
  {
    topic: "Input and strings",
    date: [2026, 10, 1],
    assignments: [
      {
        title: "Mad libs",
        type: "guided",
        summary: "Ask for three words and build a silly sentence.",
        instructions: "Ask for a noun, a verb and an adjective, then print a sentence that uses all three.",
        checkInput: "cat\njump\nfluffy",
        parts: [
          ["Asks for a noun", "begins", "Noun?"],
          ["Prints a sentence", "ends", "."],
        ],
        partialMin: 1,
      },
      {
        title: "Shout it",
        type: "guided",
        summary: "Turn any message into capital letters.",
        instructions: "Ask for a message and print it in capital letters with an exclamation mark.",
        parts: [["Prints in capitals", "ends", "!"]],
        partialMin: 1,
      },
    ],
  },
  {
    topic: "Conditionals",
    date: [2026, 10, 8],
    assignments: [
      {
        title: "Temperature check",
        type: "guided",
        summary: "Say whether it is hot, warm or cold.",
        instructions: "Given temp = 75, print hot above 85, warm from 60 to 85, otherwise cold.",
        expectedOutput: "warm",
        parts: [["Picks the right word", "equals", "warm"]],
        partialMin: 1,
      },
      {
        title: "Even or odd",
        type: "guided",
        summary: "Tell whether a number is even or odd.",
        instructions: "Given n = 7, print even or odd.",
        expectedOutput: "odd",
        parts: [["Prints odd for 7", "equals", "odd"]],
        partialMin: 1,
      },
    ],
  },
  {
    topic: "Loops",
    date: [2026, 10, 15],
    slidesUrl: "https://www.canva.com/design/DAF8xQ/loops",
    assignments: [
      {
        title: "Countdown",
        type: "guided",
        summary: "Count down from 10, then print Liftoff!",
        instructions:
          "Use a loop to count down from **10** to **1**, printing each number. Then print `Liftoff!`",
        expectedOutput: "10\n9\n8\n…\n1\nLiftoff!",
        starter: "# Countdown to liftoff\n",
        parts: [
          ["Counts down from 10", "begins", "10"],
          ["Reaches every number down to 1", "containsInOrder", "10 9 8 7 6 5 4 3 2 1"],
          ["Ends with Liftoff!", "ends", "Liftoff!"],
        ],
        partialMin: 2,
      },
      {
        title: "Forever greeter",
        type: "guided",
        summary: "A loop that never stops. Checked over 1,000 rounds.",
        instructions: "Ask for a name once, then greet that name forever with a while loop.",
        parts: [
          ["Asks for a name", "begins", "Name?"],
          ["Greets again and again", "containsInOrder", "Hello, Ada Hello, Ada Hello, Ada"],
        ],
        partialMin: 1,
        loopCheck: true,
        checkInput: "Ada",
      },
      {
        title: "Loop art",
        type: "open",
        summary: "Make a pattern with loops. Starts from a blank file.",
        instructions: "Use loops to draw a pattern made of characters. Make it your own!",
      },
      {
        title: "Skip counter",
        type: "guided",
        status: "draft",
        summary: "Print every third number up to 30.",
        instructions: "Print every third number from **3** up to **30**. When you're done counting, print `Done!`",
        starter: 'start = 3\n# your loop here\nprint("Done!")\n',
        parts: [
          ["Starts at 3", "begins", "3 6"],
          ["Counts by threes to 30", "containsInOrder", "3 6 9 12 15 18 21 24 27 30"],
          ["Ends with Done!", "ends", "Done!"],
        ],
        partialMin: 2,
      },
    ],
  },
  {
    topic: "Lists",
    date: [2026, 10, 22],
    assignments: [
      {
        title: "Shopping list",
        type: "guided",
        summary: "Add items to a list and print them.",
        instructions: "Make a list of three foods, add one more, then print each item.",
        parts: [["Prints four items", "containsInOrder", ""]],
        partialMin: 1,
      },
    ],
  },
  { topic: "Functions", assignments: [] },
  { topic: "Final project", assignments: [] },
];

const ADVANCED: DaySeed[] = [
  { topic: "Python refresher", date: [2026, 9, 15], assignments: [] },
  { topic: "Dictionaries", date: [2026, 9, 22], assignments: [] },
  { topic: "Classes and objects", date: [2026, 9, 29], assignments: [] },
  { topic: "Files and JSON", assignments: [] },
];

/** Basic roster from the design, in seating-chart order; null = empty desk. */
const BASIC_ROSTER: Array<[first: string, last: string, sinceYear?: string] | null> = [
  ["Ava", "Chen"],
  ["Jordan", "Smith", "2025-26"],
  ["Jamie", "Smith", "2025-26"],
  ["Alex", "Nguyen"],
  ["Priya", "Patel"],
  ["Marcus", "Johnson"],
  ["Sofia", "Garcia"],
  ["Liam", "O’Brien"],
  ["Noah", "Kim"],
  ["Emma", "Davis"],
  null,
  ["Mateo", "Rossi"],
  ["Zoe", "Williams"],
  ["Ethan", "Brooks"],
  ["Maya", "Singh"],
  ["Lucas", "Martin"],
  ["Chloe", "Park"],
  ["Owen", "Clark"],
  ["Isla", "Moore"],
  null,
  ["Ben", "Carter"],
  ["Grace", "Lee"],
  ["Leo", "Ramirez"],
  ["Nora", "Hughes"],
];

const ADVANCED_ROSTER: Array<[string, string]> = [
  ["Riley", "Thompson"],
  ["Hana", "Sato"],
  ["Diego", "Alvarez"],
];

const COUNTDOWN_V14 =
  '# Countdown to liftoff\ncount = 10\n\nwhile count > 0:\n    print(count)\n    count = count - 2\n\nprint("Liftoff!")\n';
const COUNTDOWN_PRIYA =
  '# Countdown to liftoff\ncount = 10\nwhile count >= 1:\n    print(count)\n    count -= 1\nprint("Liftoff")\n';
const COUNTDOWN_DONE =
  '# Countdown to liftoff\nfor n in range(10, 0, -1):\n    print(n)\nprint("Liftoff!")\n';

export const run = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    if ((await ctx.db.query("settings").first()) !== null) {
      throw appError("CONFLICT", "Already seeded: settings exist. Seed only an empty deployment.");
    }
    const admin = await ctx.db.query("admins").first();
    if (admin === null) {
      throw appError("INVALID", "Create an admin first: npx convex run admins:createAdmin '{…}'");
    }
    const teacher = admin.userId;

    await ctx.db.insert("settings", SETTINGS);

    // The previous curriculum goes first so Python Fundamentals is the newest
    // basic curriculum, which the admin screens open by default.
    const intro = await ctx.db.insert("curricula", { name: "Intro to Python", group: "basic" });
    const fundamentalsId = await ctx.db.insert("curricula", {
      name: "Python Fundamentals",
      group: "basic",
    });
    const advanced = await ctx.db.insert("curricula", { name: "Advanced Python", group: "advanced" });

    const assignmentIds = new Map<string, Id<"assignments">>();
    const revisionIds = new Map<string, Id<"assignmentRevisions">>();
    const dayIds = new Map<string, Id<"days">>();

    const seedDays = async (curriculumId: Id<"curricula">, days: DaySeed[], year: string) => {
      for (const [index, day] of days.entries()) {
        const dayId = await ctx.db.insert("days", {
          curriculumId,
          order: index + 1,
          topic: day.topic,
          slidesUrl: day.slidesUrl,
        });
        dayIds.set(`${curriculumId}:${day.topic}`, dayId);
        if (day.date) {
          const lessonAt = pt(...day.date);
          await ctx.db.insert("lessonSchedules", {
            dayId,
            year,
            lessonAt,
            turnInClosesAt: turnInCloseFor(lessonAt, SETTINGS),
          });
        }
        for (const [order, a] of day.assignments.entries()) {
          const status = a.status ?? "published";
          const assignmentId = await ctx.db.insert("assignments", {
            dayId,
            order: order + 1,
            type: a.type,
            title: a.title,
            status,
          });
          const revisionId = await ctx.db.insert("assignmentRevisions", {
            assignmentId,
            summary: a.summary,
            instructions: a.instructions,
            expectedOutput: a.expectedOutput,
            starterFiles: [{ name: "main.py", content: a.starter ?? "" }],
            parts: (a.parts ?? []).map(([name, kind, expected]) => ({ name, kind, expected })),
            partialMin: a.partialMin ?? 0,
            loopCheck: a.loopCheck ?? false,
            checkInput: a.checkInput,
            createdBy: teacher,
            createdAt: Date.now(),
          });
          await ctx.db.patch("assignments", assignmentId, {
            currentRevisionId: revisionId,
            publishedRevisionId: status === "published" ? revisionId : undefined,
          });
          assignmentIds.set(a.title, assignmentId);
          revisionIds.set(a.title, revisionId);
        }
      }
    };

    await seedDays(fundamentalsId, FUNDAMENTALS, SETTINGS.currentYear);
    await seedDays(advanced, ADVANCED, SETTINGS.currentYear);
    await seedDays(
      intro,
      [
        {
          topic: "Final project",
          date: [2026, 5, 7],
          assignments: [
            {
              title: "Guessing game",
              type: "open",
              summary: "Build a number guessing game.",
              instructions: "Pick a secret number and let the player guess until they get it.",
            },
          ],
        },
      ],
      "2025-26",
    );

    // Students, in seating order so login codes match the design (jsmith, jsmith1).
    const studentIds = new Map<string, Id<"students">>();
    const addStudent = async (
      first: string,
      last: string,
      group: "basic" | "advanced",
      curriculumId: Id<"curricula">,
      sinceYear: string,
      seatIndex?: number,
    ) => {
      const userId = await ctx.db.insert("users", { name: `${first} ${last}`, role: "student" });
      const loginCode = await allocateLoginCode(ctx, first, last);
      const id = await ctx.db.insert("students", {
        userId,
        firstName: first,
        lastName: last,
        loginCode,
        group,
        curriculumId,
        sinceYear,
        seatIndex,
      });
      studentIds.set(`${first} ${last}`, id);
      return id;
    };
    for (const [seat, entry] of BASIC_ROSTER.entries()) {
      if (entry === null) continue;
      const [first, last, since] = entry;
      await addStudent(first, last, "basic", fundamentalsId, since ?? SETTINGS.currentYear, seat);
    }
    for (const [seat, [first, last]] of ADVANCED_ROSTER.entries()) {
      await addStudent(first, last, "advanced", advanced, SETTINGS.currentYear, seat);
    }

    const work = new WorkSeeder(ctx, teacher, assignmentIds, revisionIds);
    const jordan = studentIds.get("Jordan Smith")!;

    // Jordan: Days 1, 2 and 4 turned in, Day 3 partly, Day 5 in progress.
    await work.add(jordan, "Hello, world", { code: 'print("Hello, world!")\n', version: 3, savedAt: pt(2026, 9, 17, 16, 30), submit: { at: pt(2026, 9, 17, 16, 40), outcome: "complete", reviewedAt: pt(2026, 9, 21, 9) } });
    await work.add(jordan, "Say it twice", { code: 'print("Python is fun!")\nprint("Python is fun!")\n', version: 2, savedAt: pt(2026, 9, 17, 16, 50), submit: { at: pt(2026, 9, 17, 16, 52), outcome: "complete" } });
    await work.add(jordan, "Name tag", { code: 'name = "Jordan"\nage = 12\nprint("Hi, I\'m", name, "and I\'m", str(age) + ".")\n', version: 7, savedAt: pt(2026, 9, 25, 15, 38), submit: { at: pt(2026, 9, 25, 15, 40), outcome: "complete", reviewedAt: pt(2026, 9, 28, 9), feedback: "Nice work! Try adding your favorite color too." } });
    await work.add(jordan, "Swap two values", { code: "a = 1\nb = 2\na, b = b, a\nprint(a)\nprint(b)\n", version: 4, savedAt: pt(2026, 9, 24, 16, 45), submit: { at: pt(2026, 9, 24, 16, 46), outcome: "complete" } });
    await work.add(jordan, "Rectangle area", { code: "width = 7\nheight = 3\nprint(width * height)\n", version: 2, savedAt: pt(2026, 9, 24, 16, 55), submit: { at: pt(2026, 9, 24, 16, 56), outcome: "complete" } });
    await work.add(jordan, "Mad libs", { code: 'noun = input("Noun? ")\n', version: 3, savedAt: pt(2026, 10, 1, 16, 50) });
    await work.add(jordan, "Shout it", { code: 'message = input("Message? ")\nprint(message.upper() + "!")\n', version: 3, savedAt: pt(2026, 10, 1, 16, 40), submit: { at: pt(2026, 10, 1, 16, 42), outcome: "complete" } });
    await work.add(jordan, "Temperature check", { code: 'temp = 75\nif temp > 85:\n    print("hot")\nelif temp >= 60:\n    print("warm")\nelse:\n    print("cold")\n', version: 5, savedAt: pt(2026, 10, 8, 16, 40), submit: { at: pt(2026, 10, 8, 16, 41), outcome: "complete" } });
    await work.add(jordan, "Even or odd", { code: 'n = 7\nprint("even" if n % 2 == 0 else "odd")\n', version: 2, savedAt: pt(2026, 10, 8, 16, 50), submit: { at: pt(2026, 10, 8, 16, 51), outcome: "complete" } });
    const countdown = await work.add(jordan, "Countdown", { code: COUNTDOWN_V14, version: 14, savedAt: Date.now() - 12_000, check: "partial" });

    // Countdown review queue from the design.
    const priya = studentIds.get("Priya Patel")!;
    await work.add(priya, "Countdown", {
      code: COUNTDOWN_PRIYA,
      version: 19,
      savedAt: pt(2026, 10, 15, 15, 10),
      submit: { at: pt(2026, 10, 15, 14, 20), outcome: "none", reviewedAt: pt(2026, 10, 15, 14, 45) },
      resubmit: { at: pt(2026, 10, 15, 15, 12), outcome: "partial" },
    });
    for (const [name, at, outcome] of [
      ["Noah Kim", pt(2026, 10, 15, 14, 58), "complete"],
      ["Ava Chen", pt(2026, 10, 15, 14, 41), "complete"],
      ["Maya Singh", pt(2026, 10, 15, 14, 30), "partial"],
      ["Isla Moore", pt(2026, 10, 15, 14, 12), "none"],
    ] as const) {
      await work.add(studentIds.get(name)!, "Countdown", {
        code: outcome === "complete" ? COUNTDOWN_DONE : COUNTDOWN_PRIYA,
        version: 6,
        savedAt: at - 60_000,
        submit: { at, outcome },
      });
    }
    await work.add(studentIds.get("Owen Clark")!, "Countdown", {
      code: COUNTDOWN_DONE,
      version: 5,
      savedAt: pt(2026, 10, 15, 13, 49),
      submit: { at: pt(2026, 10, 15, 13, 50), outcome: "complete", reviewedAt: pt(2026, 10, 15, 14) },
    });

    // Jordan's previous-curriculum final project (2025–26).
    await work.add(jordan, "Guessing game", {
      code: 'import random\nsecret = random.randint(1, 10)\nguess = 0\nwhile guess != secret:\n    guess = int(input("Guess? "))\nprint("You got it!")\n',
      version: 11,
      savedAt: pt(2026, 5, 20, 16),
      submit: { at: pt(2026, 5, 20, 16, 5), outcome: null, reviewedAt: pt(2026, 5, 22, 9) },
      year: "2025-26",
      curriculumId: intro,
    });

    // Open help requests: Jordan (3 min) and Alex (1 min).
    const now = Date.now();
    await ctx.db.insert("helpRequests", {
      studentId: jordan,
      workspaceId: countdown,
      status: "open",
      createdAt: now - 3 * 60_000,
    });
    const alexWork = await work.add(studentIds.get("Alex Nguyen")!, "Forever greeter", {
      code: 'name = input("Name? ")\nwhile True:\n    print("Hello,", nam)\n',
      version: 4,
      savedAt: now - 60_000,
    });
    await ctx.db.insert("helpRequests", {
      studentId: studentIds.get("Alex Nguyen")!,
      workspaceId: alexWork,
      status: "open",
      createdAt: now - 60_000,
    });

    return `Seeded ${studentIds.size} students, ${assignmentIds.size} assignments and ${dayIds.size} days.`;
  },
});

type WorkSeed = {
  code: string;
  version: number;
  savedAt: number;
  check?: "complete" | "partial" | "none";
  submit?: {
    at: number;
    outcome: "complete" | "partial" | "none" | null;
    reviewedAt?: number;
    feedback?: string;
  };
  resubmit?: { at: number; outcome: "complete" | "partial" | "none" };
  year?: string;
  curriculumId?: Id<"curricula">;
};

/** Writes a workspace with files, a version, and optional checks/submissions. */
class WorkSeeder {
  constructor(
    private ctx: MutationCtx,
    private teacher: Id<"users">,
    private assignments: Map<string, Id<"assignments">>,
    private revisions: Map<string, Id<"assignmentRevisions">>,
  ) {}

  async add(studentId: Id<"students">, title: string, seed: WorkSeed): Promise<Id<"workspaces">> {
    const { ctx } = this;
    const student = (await ctx.db.get("students", studentId))!;
    const assignmentId = this.assignments.get(title)!;
    const revisionId = this.revisions.get(title)!;
    const files = [{ name: "main.py", content: seed.code }];
    const workspaceId = await ctx.db.insert("workspaces", {
      studentId,
      assignmentId,
      year: seed.year ?? SETTINGS.currentYear,
      group: student.group,
      curriculumId: seed.curriculumId ?? student.curriculumId,
      latestVersion: seed.version,
      updatedAt: seed.savedAt,
    });
    await ctx.db.insert("workFiles", {
      workspaceId,
      name: "main.py",
      content: seed.code,
      updatedAt: seed.savedAt,
      updatedBy: student.userId,
    });
    const versionId = await ctx.db.insert("workVersions", {
      workspaceId,
      number: seed.version,
      files,
      createdBy: student.userId,
      createdAt: seed.savedAt,
      reason: "autosave",
    });

    const checkFor = async (outcome: "complete" | "partial" | "none", at: number) => {
      const revision = (await ctx.db.get("assignmentRevisions", revisionId))!;
      const needed = outcome === "complete" ? revision.parts.length : outcome === "partial" ? revision.partialMin : 0;
      return await ctx.db.insert("checkResults", {
        workspaceId,
        versionId,
        revisionId,
        outcome,
        parts: revision.parts.map((part, i) => ({ name: part.name, met: i < needed })),
        ranBy: student.userId,
        ranAt: at,
      });
    };

    if (seed.check) await checkFor(seed.check, seed.savedAt);

    const attempts = [seed.submit, seed.resubmit].filter((a) => a !== undefined);
    for (const [index, attempt] of attempts.entries()) {
      const checkResultId = attempt.outcome ? await checkFor(attempt.outcome, attempt.at) : undefined;
      const reviewedAt = "reviewedAt" in attempt ? attempt.reviewedAt : undefined;
      const submissionId = await ctx.db.insert("submissions", {
        workspaceId,
        studentId,
        assignmentId,
        attempt: index + 1,
        versionId,
        submittedAt: attempt.at,
        checkResultId,
        status: reviewedAt ? "reviewed" : "unreviewed",
        reviewedBy: reviewedAt ? this.teacher : undefined,
        reviewedAt,
        idempotencyKey: `seed-${workspaceId}-${index + 1}`,
      });
      if ("feedback" in attempt && attempt.feedback) {
        await ctx.db.insert("feedback", {
          submissionId,
          studentId,
          authorId: this.teacher,
          body: attempt.feedback,
          visibility: "student",
          createdAt: reviewedAt ?? attempt.at,
        });
      }
    }
    return workspaceId;
  }
}
