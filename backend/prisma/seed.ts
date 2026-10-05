/* eslint-disable no-console */
import crypto from 'crypto';
import { PrismaClient, QuestionType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function hash(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

interface QuestionSeed {
  chapterKey: string;
  type: QuestionType;
  text: string;
  explanation: string;
  correctAnswerText?: string;
  options?: { text: string; isCorrect: boolean }[];
}

async function main() {
  console.log('Seeding database...');

  // Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: { name: 'SUPERADMIN' },
  });
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });
  const studentRole = await prisma.role.upsert({
    where: { name: 'STUDENT' },
    update: {},
    create: { name: 'STUDENT' },
  });

  // Users
  const adminPasswordHash = await hash('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@computer.local' },
    update: {},
    create: {
      email: 'admin@computer.local',
      passwordHash: adminPasswordHash,
      name: 'Platform Admin',
      roleId: adminRole.id,
    },
  });

  // SUPERADMIN: full admin rights everywhere, plus able to switch into the
  // student experience (Notes, etc.) from the same account without the
  // grade lock students are normally subject to - see classScopeOf, which
  // only restricts the STUDENT role.
  const superAdminPasswordHash = await hash('laptop321');
  await prisma.user.upsert({
    where: { email: 'ali.khaliq50@gmail.com' },
    update: {},
    create: {
      email: 'ali.khaliq50@gmail.com',
      passwordHash: superAdminPasswordHash,
      name: 'Ali Khaliq',
      roleId: superAdminRole.id,
    },
  });

  const studentPasswordHash = await hash('Student@123');
  // Deliberately left with classId = null so the "select your grade" gate is
  // demonstrable on this account's first login (it is also what every student
  // created before grade selection existed looks like).
  await prisma.user.upsert({
    where: { email: 'student@computer.local' },
    update: {},
    create: {
      email: 'student@computer.local',
      passwordHash: studentPasswordHash,
      name: 'Demo Student',
      roleId: studentRole.id,
    },
  });

  // ───────────────────────────────────────────────────────────────────────
  // Content tree: Class -> Subjects -> Chapters, for two grades.
  // ───────────────────────────────────────────────────────────────────────

  async function upsertQuestion(data: Parameters<typeof prisma.question.create>[0]['data']) {
    // Real question IDs must be UUIDs - deleteMany+create by text keeps this
    // script idempotent without relying on a natural key on questions.
    await prisma.question.deleteMany({ where: { text: data.text } });
    return prisma.question.create({ data: { id: crypto.randomUUID(), ...data } });
  }

  async function seedGrade(
    classDef: { title: string; slug: string; order: number },
    subjectDefs: { title: string; slug: string; chapters: { title: string; slug: string }[] }[],
    questionDefs: QuestionSeed[],
  ) {
    const cls = await prisma.class.upsert({
      where: { slug: classDef.slug },
      update: {},
      create: {
        title: classDef.title,
        slug: classDef.slug,
        order: classDef.order,
        isPublished: true,
        createdById: admin.id,
      },
    });

    const chapterIds: Record<string, string> = {};

    for (const [sIdx, subjectDef] of subjectDefs.entries()) {
      const subject = await prisma.subject.upsert({
        where: { classId_slug: { classId: cls.id, slug: subjectDef.slug } },
        update: {},
        create: {
          classId: cls.id,
          title: subjectDef.title,
          slug: subjectDef.slug,
          order: sIdx + 1,
          isPublished: true,
          createdById: admin.id,
        },
      });

      for (const [cIdx, chapterDef] of subjectDef.chapters.entries()) {
        const chapter = await prisma.chapter.upsert({
          where: { subjectId_slug: { subjectId: subject.id, slug: chapterDef.slug } },
          update: {},
          create: {
            subjectId: subject.id,
            title: chapterDef.title,
            slug: chapterDef.slug,
            order: cIdx + 1,
            isPublished: true,
            createdById: admin.id,
          },
        });
        chapterIds[`${subjectDef.slug}/${chapterDef.slug}`] = chapter.id;
      }
    }

    for (const q of questionDefs) {
      await upsertQuestion({
        chapterId: chapterIds[q.chapterKey],
        type: q.type,
        text: q.text,
        explanation: q.explanation,
        isPublished: true,
        createdById: admin.id,
        correctAnswerText: q.correctAnswerText,
        options: q.options ? { create: q.options } : undefined,
      });
    }

    return { classId: cls.id, questionCount: questionDefs.length };
  }

  // ───────────────────────────────────────────────────────────────────────
  // Grade 9
  // ───────────────────────────────────────────────────────────────────────
  console.log('Seeding Grade 9...');

  const grade9Subjects = [
    {
      title: 'Computer Science Fundamentals',
      slug: 'cs-fundamentals',
      chapters: [
        { title: 'Chapter 1: Hardware and Software Basics', slug: 'chapter-1' },
        { title: 'Chapter 2: The CPU and Memory', slug: 'chapter-2' },
      ],
    },
    {
      title: 'Web Development',
      slug: 'web-development',
      chapters: [
        { title: 'Chapter 1: HTML and CSS', slug: 'chapter-1' },
        { title: 'Chapter 2: How the Web Works', slug: 'chapter-2' },
      ],
    },
  ];

  const grade9Questions: QuestionSeed[] = [
    {
      chapterKey: 'cs-fundamentals/chapter-1',
      type: QuestionType.MCQ,
      text: 'What does CPU stand for?',
      explanation: 'CPU stands for Central Processing Unit.',
      options: [
        { text: 'Central Processing Unit', isCorrect: true },
        { text: 'Computer Personal Unit', isCorrect: false },
        { text: 'Central Program Utility', isCorrect: false },
      ],
    },
    {
      chapterKey: 'cs-fundamentals/chapter-1',
      type: QuestionType.TRUE_FALSE,
      text: 'RAM is a type of non-volatile storage.',
      explanation: 'RAM is volatile memory; it loses data when power is off.',
      options: [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: true },
      ],
    },
    {
      chapterKey: 'cs-fundamentals/chapter-1',
      type: QuestionType.SHORT_ANSWER,
      text: 'What is the difference between system software and application software?',
      explanation:
        'System software manages and runs the computer itself (operating systems, device drivers, utilities).\n' +
        'Application software performs tasks for the user (browsers, word processors, games).\n' +
        'Application software runs on top of, and depends on, system software.',
    },
    {
      chapterKey: 'cs-fundamentals/chapter-1',
      type: QuestionType.FILL_BLANK,
      text: 'A ____ is used to repeat a block of code multiple times.',
      explanation: 'Loops (for, while) repeat a block of code.',
      correctAnswerText: 'loop',
    },
    {
      chapterKey: 'cs-fundamentals/chapter-2',
      type: QuestionType.SHORT_ANSWER,
      text: 'Explain the fetch-decode-execute cycle in your own words.',
      explanation:
        'Fetch: the control unit copies the next instruction from memory into the instruction register.\n' +
        'Decode: the instruction is interpreted to work out which operation is required.\n' +
        'Execute: the ALU (or another unit) carries out the operation and the result is stored.\n' +
        'The cycle then repeats for the next instruction.',
    },
    {
      chapterKey: 'cs-fundamentals/chapter-2',
      type: QuestionType.LONG_ANSWER,
      text: 'Compare primary storage and secondary storage, giving two examples of each.',
      explanation:
        'Primary storage is directly accessible to the CPU, fast, small and usually volatile - for example RAM and cache.\n' +
        'Secondary storage is not directly accessible to the CPU, slower, much larger and non-volatile - for example an SSD or a hard disk drive.\n' +
        'Data must be loaded from secondary storage into primary storage before the CPU can work with it, which is why a computer with too little RAM spends time swapping data back and forth.',
    },
    {
      chapterKey: 'cs-fundamentals/chapter-2',
      type: QuestionType.MCQ,
      text: 'Which of these is volatile memory?',
      explanation: 'RAM is volatile; ROM, SSD and HDD are non-volatile.',
      options: [
        { text: 'RAM', isCorrect: true },
        { text: 'ROM', isCorrect: false },
        { text: 'SSD', isCorrect: false },
        { text: 'HDD', isCorrect: false },
      ],
    },
    {
      chapterKey: 'web-development/chapter-1',
      type: QuestionType.SHORT_ANSWER,
      text: 'What is the purpose of CSS in a web page?',
      explanation:
        'CSS (Cascading Style Sheets) controls presentation: layout, colours, spacing, typography and responsiveness.\n' +
        'Keeping it separate from the HTML means the same content can be restyled without changing its structure.',
    },
    {
      chapterKey: 'web-development/chapter-1',
      type: QuestionType.FILL_BLANK,
      text: '____ is the standard markup language for creating web pages.',
      explanation: 'HTML (HyperText Markup Language).',
      correctAnswerText: 'HTML',
    },
    {
      chapterKey: 'web-development/chapter-2',
      type: QuestionType.LONG_ANSWER,
      text: 'Describe what happens, step by step, when a user types a URL into a browser and presses Enter.',
      explanation:
        '1. The browser resolves the domain name to an IP address using DNS.\n' +
        '2. It opens a TCP connection to that address (and completes a TLS handshake for https).\n' +
        '3. It sends an HTTP request for the requested resource.\n' +
        '4. The server processes the request and returns an HTTP response with the HTML.\n' +
        '5. The browser parses the HTML, requests the referenced CSS, JavaScript and images, and builds the DOM.\n' +
        '6. It renders the page and runs the scripts, repeating requests as needed.',
    },
    {
      chapterKey: 'web-development/chapter-2',
      type: QuestionType.MCQ,
      text: 'Which protocol is used to send email?',
      explanation: 'SMTP (Simple Mail Transfer Protocol) is used to send email.',
      options: [
        { text: 'SMTP', isCorrect: true },
        { text: 'HTTP', isCorrect: false },
        { text: 'FTP', isCorrect: false },
        { text: 'SSH', isCorrect: false },
      ],
    },
    {
      chapterKey: 'web-development/chapter-2',
      type: QuestionType.TRUE_FALSE,
      text: 'A stack follows First-In-First-Out (FIFO) order.',
      explanation: 'A stack is Last-In-First-Out (LIFO); a queue is FIFO.',
      options: [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: true },
      ],
    },
  ];

  const grade9 = await seedGrade(
    { title: 'Grade 9', slug: 'grade-9', order: 1 },
    grade9Subjects,
    grade9Questions,
  );
  console.log(`  Grade 9: 2 subjects, 4 chapters, ${grade9.questionCount} questions`);

  // ───────────────────────────────────────────────────────────────────────
  // Grade 10
  // ───────────────────────────────────────────────────────────────────────
  console.log('Seeding Grade 10...');

  const grade10Subjects = [
    {
      title: 'Programming Fundamentals',
      slug: 'programming-fundamentals',
      chapters: [
        { title: 'Chapter 1: Data Types and Variables', slug: 'chapter-1' },
        { title: 'Chapter 2: Control Flow and Functions', slug: 'chapter-2' },
      ],
    },
    {
      title: 'Databases and Networks',
      slug: 'databases-and-networks',
      chapters: [
        { title: 'Chapter 1: Relational Databases', slug: 'chapter-1' },
        { title: 'Chapter 2: Networking Basics', slug: 'chapter-2' },
      ],
    },
  ];

  const grade10Questions: QuestionSeed[] = [
    {
      chapterKey: 'programming-fundamentals/chapter-1',
      type: QuestionType.MCQ,
      text: 'Which data type would you use to store the value 3.14?',
      explanation: 'A floating-point type (float/double) stores numbers with a fractional part.',
      options: [
        { text: 'int', isCorrect: false },
        { text: 'float', isCorrect: true },
        { text: 'boolean', isCorrect: false },
        { text: 'char', isCorrect: false },
      ],
    },
    {
      chapterKey: 'programming-fundamentals/chapter-1',
      type: QuestionType.SHORT_ANSWER,
      text: 'What is the difference between a variable and a constant?',
      explanation:
        'A variable holds a value that may change while the program runs.\n' +
        'A constant is given a value once and may not be reassigned afterwards.\n' +
        'Using constants for fixed values makes intent clear and prevents accidental changes.',
    },
    {
      chapterKey: 'programming-fundamentals/chapter-1',
      type: QuestionType.LONG_ANSWER,
      text: 'Explain implicit and explicit type conversion, and describe a situation where each is used.',
      explanation:
        'Implicit conversion (coercion) is performed automatically by the language when it is safe to do so, for example widening an int to a float in `3 + 2.5`.\n' +
        'Explicit conversion (casting) is written by the programmer, for example `int(2.9)`, and is used when the conversion may lose information or is otherwise ambiguous.\n' +
        'Implicit conversion keeps simple arithmetic readable; explicit conversion is needed when reading user input as text and turning it into a number, or when deliberately truncating a value.',
    },
    {
      chapterKey: 'programming-fundamentals/chapter-1',
      type: QuestionType.FILL_BLANK,
      text: 'A ____ cannot be reassigned once it has been given a value.',
      explanation: 'A constant.',
      correctAnswerText: 'constant',
    },
    {
      chapterKey: 'programming-fundamentals/chapter-2',
      type: QuestionType.TRUE_FALSE,
      text: 'A while loop always executes its body at least once.',
      explanation:
        'False - a while loop tests its condition first, so the body may never run. A do-while loop runs once before testing.',
      options: [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: true },
      ],
    },
    {
      chapterKey: 'programming-fundamentals/chapter-2',
      type: QuestionType.SHORT_ANSWER,
      text: 'Why are functions useful when writing a large program?',
      explanation:
        'Functions let a problem be split into small, named pieces that can be understood and tested on their own.\n' +
        'They remove duplication, because the same logic can be called from many places.\n' +
        'They make change safer: a fix applied inside a function applies everywhere it is used.',
    },
    {
      chapterKey: 'databases-and-networks/chapter-1',
      type: QuestionType.SHORT_ANSWER,
      text: 'What is a primary key, and why must it be unique?',
      explanation:
        'A primary key is the column (or set of columns) that identifies each row in a table.\n' +
        'It must be unique and non-null, otherwise two rows could not be told apart and other tables could not reliably refer to a single row through a foreign key.',
    },
    {
      chapterKey: 'databases-and-networks/chapter-1',
      type: QuestionType.LONG_ANSWER,
      text: 'Describe the relationship between a primary key and a foreign key, using an example of your own.',
      explanation:
        'A primary key uniquely identifies a row in its own table. A foreign key is a column in another table that stores the value of some row\'s primary key, creating a link between the two.\n' +
        'For example, a `students` table has a primary key `id`, and an `enrolments` table has a `student_id` foreign key pointing at it.\n' +
        'The database can then enforce referential integrity: an enrolment cannot reference a student who does not exist, and deleting a student can be blocked or cascaded to their enrolments.',
    },
    {
      chapterKey: 'databases-and-networks/chapter-2',
      type: QuestionType.MCQ,
      text: 'Which device connects two different networks together and routes traffic between them?',
      explanation: 'A router forwards packets between networks; a switch only works within one network.',
      options: [
        { text: 'Switch', isCorrect: false },
        { text: 'Router', isCorrect: true },
        { text: 'Repeater', isCorrect: false },
        { text: 'Hub', isCorrect: false },
      ],
    },
    {
      chapterKey: 'databases-and-networks/chapter-2',
      type: QuestionType.SHORT_ANSWER,
      text: 'Explain the difference between a LAN and a WAN.',
      explanation:
        'A LAN (Local Area Network) covers a small area such as one building, is usually owned and maintained by one organisation, and offers high speeds.\n' +
        'A WAN (Wide Area Network) spans towns, countries or continents, typically uses infrastructure leased from telecommunications providers, and has lower speeds and higher latency. The internet is the largest WAN.',
    },
    {
      chapterKey: 'databases-and-networks/chapter-2',
      type: QuestionType.FILL_BLANK,
      text: '____ translates human-readable domain names into IP addresses.',
      explanation: 'DNS (the Domain Name System).',
      correctAnswerText: 'DNS',
    },
  ];

  const grade10 = await seedGrade(
    { title: 'Grade 10', slug: 'grade-10', order: 2 },
    grade10Subjects,
    grade10Questions,
  );
  console.log(`  Grade 10: 2 subjects, 4 chapters, ${grade10.questionCount} questions`);

  console.log('Seed complete:');
  console.log(`  Roles: SUPERADMIN(${superAdminRole.id}), ADMIN(${adminRole.id}), STUDENT(${studentRole.id})`);
  console.log(`  Superadmin user: ali.khaliq50@gmail.com / laptop321 (full admin rights + can switch to student view)`);
  console.log(`  Admin user: ${admin.email} / Admin@123`);
  console.log('  Demo student: student@computer.local / Student@123 (no grade set - will hit the grade gate on first login)');
  console.log(`  Classes: Grade 9 (${grade9.classId}), Grade 10 (${grade10.classId})`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
