import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const stamp = Date.now();
const adminEmail = `notes-admin-${stamp}@example.com`;
const studentEmail = `notes-student-${stamp}@example.com`;
const classSlug = `notes-class-${stamp}`;
const subjectSlug = `notes-subject-${stamp}`;

let adminToken: string;
let studentToken: string;
let adminId: string;
let classId: string;
let subjectId: string;
let chapterAId: string;
let chapterBId: string;

const SHORT_TEXT = `Notes: explain what a compiler does (${stamp})`;
const LONG_TEXT = `Notes: describe the software development lifecycle (${stamp})`;
const CHAPTER_B_TEXT = `Notes: explain recursion with an example (${stamp})`;
const DRAFT_TEXT = `Notes: unpublished exercise question (${stamp})`;

interface NoteItem {
  id: string;
  text: string;
  explanation: string | null;
  type: string;
  chapterId: string;
  chapter: { id: string; title: string; subjectId: string };
}

describe('notes (exercise questions + model answers)', () => {
  beforeAll(async () => {
    const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
    const studentRole = await prisma.role.upsert({
      where: { name: 'STUDENT' },
      update: {},
      create: { name: 'STUDENT' },
    });

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Notes Admin',
        passwordHash: await hashPassword('AdminPass123'),
        roleId: adminRole.id,
      },
    });
    adminId = admin.id;

    await prisma.user.create({
      data: {
        email: studentEmail,
        name: 'Notes Student',
        passwordHash: await hashPassword('StudentPass123'),
        roleId: studentRole.id,
      },
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'AdminPass123' });
    adminToken = adminLogin.body.data.accessToken;

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: studentEmail, password: 'StudentPass123' });
    studentToken = studentLogin.body.data.accessToken;

    const cls = await prisma.class.create({
      data: { title: 'Notes Class', slug: classSlug, order: 1, createdById: adminId, isPublished: true },
    });
    classId = cls.id;

    const subject = await prisma.subject.create({
      data: {
        classId,
        title: 'Notes Subject',
        slug: subjectSlug,
        order: 1,
        createdById: adminId,
        isPublished: true,
      },
    });
    subjectId = subject.id;

    const chapterA = await prisma.chapter.create({
      data: {
        subjectId,
        title: 'Notes Chapter A',
        slug: `notes-chapter-a-${stamp}`,
        order: 1,
        createdById: adminId,
        isPublished: true,
      },
    });
    chapterAId = chapterA.id;

    const chapterB = await prisma.chapter.create({
      data: {
        subjectId,
        title: 'Notes Chapter B',
        slug: `notes-chapter-b-${stamp}`,
        order: 2,
        createdById: adminId,
        isPublished: true,
      },
    });
    chapterBId = chapterB.id;

    // Chapter A: one SHORT_ANSWER, one LONG_ANSWER, one unpublished exercise
    // question, plus an MCQ and a FILL_BLANK that must never show up as notes.
    await prisma.question.create({
      data: {
        chapterId: chapterAId,
        type: 'SHORT_ANSWER',
        text: SHORT_TEXT,
        explanation: 'A compiler translates source code into machine code before the program runs.',
        isPublished: true,
        createdById: adminId,
      },
    });
    await prisma.question.create({
      data: {
        chapterId: chapterAId,
        type: 'LONG_ANSWER',
        text: LONG_TEXT,
        explanation: 'Requirements, design, implementation, testing, deployment and maintenance.',
        isPublished: true,
        createdById: adminId,
      },
    });
    await prisma.question.create({
      data: {
        chapterId: chapterAId,
        type: 'SHORT_ANSWER',
        text: DRAFT_TEXT,
        explanation: 'Not visible to students yet.',
        isPublished: false,
        createdById: adminId,
      },
    });
    await prisma.question.create({
      data: {
        chapterId: chapterAId,
        type: 'MCQ',
        text: `Notes: which of these is an exercise question type? (${stamp})`,
        isPublished: true,
        createdById: adminId,
        options: {
          create: [
            { text: 'MCQ', isCorrect: false },
            { text: 'LONG_ANSWER', isCorrect: true },
          ],
        },
      },
    });
    await prisma.question.create({
      data: {
        chapterId: chapterAId,
        type: 'FILL_BLANK',
        text: `Notes: a ____ translates source code (${stamp})`,
        isPublished: true,
        createdById: adminId,
        correctAnswerText: 'compiler',
      },
    });

    // Chapter B: one more published SHORT_ANSWER, for the chapter filter.
    await prisma.question.create({
      data: {
        chapterId: chapterBId,
        type: 'SHORT_ANSWER',
        text: CHAPTER_B_TEXT,
        explanation: 'A function that calls itself, with a base case that stops the recursion.',
        isPublished: true,
        createdById: adminId,
      },
    });
  });

  afterAll(async () => {
    await prisma.questionOption.deleteMany({ where: { question: { chapter: { subjectId } } } });
    await prisma.question.deleteMany({ where: { chapter: { subjectId } } });
    await prisma.chapter.deleteMany({ where: { subjectId } });
    await prisma.subject.deleteMany({ where: { id: subjectId } });
    await prisma.class.deleteMany({ where: { id: classId } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, studentEmail] } } });
    await prisma.$disconnect();
  });

  it('returns only published SHORT_ANSWER/LONG_ANSWER questions to a student', async () => {
    const res = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ subjectId, pageSize: 50 });

    expect(res.status).toBe(200);
    const items: NoteItem[] = res.body.data.items;
    expect(items.length).toBe(3);
    expect(items.every((i) => i.type === 'SHORT_ANSWER' || i.type === 'LONG_ANSWER')).toBe(true);
    expect(items.some((i) => i.text === DRAFT_TEXT)).toBe(false);
  });

  it('includes unpublished exercise questions for an admin', async () => {
    const res = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ subjectId, pageSize: 50 });

    expect(res.status).toBe(200);
    const items: NoteItem[] = res.body.data.items;
    expect(items.some((i) => i.text === DRAFT_TEXT)).toBe(true);
    expect(items.every((i) => i.type === 'SHORT_ANSWER' || i.type === 'LONG_ANSWER')).toBe(true);
  });

  it('filters by chapterId', async () => {
    const res = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ chapterId: chapterBId, pageSize: 50 });

    expect(res.status).toBe(200);
    const items: NoteItem[] = res.body.data.items;
    expect(items).toHaveLength(1);
    expect(items[0].text).toBe(CHAPTER_B_TEXT);
    expect(items[0].chapterId).toBe(chapterBId);
    expect(items[0].chapter).toEqual({ id: chapterBId, title: 'Notes Chapter B', subjectId });
  });

  it('returns the model answer (explanation) on each note', async () => {
    const res = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ chapterId: chapterAId, pageSize: 50 });

    expect(res.status).toBe(200);
    const items: NoteItem[] = res.body.data.items;
    const short = items.find((i) => i.text === SHORT_TEXT);
    expect(short).toBeDefined();
    expect(short!.explanation).toContain('translates source code');
  });

  it('never exposes answer-key fields', async () => {
    const res = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ subjectId, pageSize: 50 });

    expect(res.status).toBe(200);
    const items: Record<string, unknown>[] = res.body.data.items;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => !('correctAnswerText' in i))).toBe(true);
    expect(items.every((i) => !('options' in i))).toBe(true);
  });

  it('filters by free-text q (case-insensitive) on the question text', async () => {
    const res = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ subjectId, q: 'RECURSION', pageSize: 50 });

    expect(res.status).toBe(200);
    const items: NoteItem[] = res.body.data.items;
    expect(items).toHaveLength(1);
    expect(items[0].text).toBe(CHAPTER_B_TEXT);

    const noMatch = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ subjectId, q: 'definitely-not-in-any-note', pageSize: 50 });
    expect(noMatch.status).toBe(200);
    expect(noMatch.body.data.items).toHaveLength(0);
    expect(noMatch.body.data.total).toBe(0);
  });

  it('paginates with the { items, total, page, pageSize } shape', async () => {
    const page1 = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ subjectId, page: 1, pageSize: 2 });

    expect(page1.status).toBe(200);
    expect(page1.body.data).toHaveProperty('items');
    expect(page1.body.data).toHaveProperty('total', 3);
    expect(page1.body.data).toHaveProperty('page', 1);
    expect(page1.body.data).toHaveProperty('pageSize', 2);
    expect(page1.body.data.items).toHaveLength(2);

    const page2 = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ subjectId, page: 2, pageSize: 2 });

    expect(page2.status).toBe(200);
    expect(page2.body.data.page).toBe(2);
    expect(page2.body.data.items).toHaveLength(1);

    const page1Ids = page1.body.data.items.map((i: NoteItem) => i.id);
    const page2Ids = page2.body.data.items.map((i: NoteItem) => i.id);
    expect(page1Ids.some((id: string) => page2Ids.includes(id))).toBe(false);
  });
});
