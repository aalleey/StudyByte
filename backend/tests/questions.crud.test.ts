import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const stamp = Date.now();
const adminEmail = `questions-admin-${stamp}@example.com`;
const studentEmail = `questions-student-${stamp}@example.com`;
const classSlug = `questions-class-${stamp}`;
const subjectSlug = `questions-subject-${stamp}`;
const chapterSlug = `questions-chapter-${stamp}`;

let adminToken: string;
let studentToken: string;
let adminId: string;
let classId: string;
let subjectId: string;
let chapterId: string;

const createdQuestionIds: string[] = [];

describe('questions CRUD + RBAC + publish + pagination + filters', () => {
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
        name: 'Questions Admin',
        passwordHash: await hashPassword('AdminPass123'),
        roleId: adminRole.id,
      },
    });
    adminId = admin.id;

    await prisma.user.create({
      data: {
        email: studentEmail,
        name: 'Questions Student',
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
      data: { title: 'Questions Class', slug: classSlug, order: 1, createdById: adminId, isPublished: true },
    });
    classId = cls.id;

    const subject = await prisma.subject.create({
      data: {
        classId,
        title: 'Questions Subject',
        slug: subjectSlug,
        order: 1,
        createdById: adminId,
        isPublished: true,
      },
    });
    subjectId = subject.id;

    const chapter = await prisma.chapter.create({
      data: {
        subjectId,
        title: 'Questions Chapter',
        slug: chapterSlug,
        order: 1,
        createdById: adminId,
        isPublished: true,
      },
    });
    chapterId = chapter.id;
  });

  afterAll(async () => {
    await prisma.questionOption.deleteMany({ where: { question: { chapterId } } });
    await prisma.question.deleteMany({ where: { chapterId } });
    await prisma.chapter.deleteMany({ where: { id: chapterId } });
    await prisma.subject.deleteMany({ where: { id: subjectId } });
    await prisma.class.deleteMany({ where: { id: classId } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, studentEmail] } } });
    await prisma.$disconnect();
  });

  it('rejects unauthenticated create', async () => {
    const res = await request(app).post('/api/v1/questions').send({
      chapterId,
      type: 'MCQ',
      text: 'What is 2+2?',
      options: [
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
      ],
    });
    expect(res.status).toBe(401);
  });

  it('rejects create from a STUDENT (RBAC)', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        chapterId,
        type: 'MCQ',
        text: 'What is 2+2?',
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
        ],
      });
    expect(res.status).toBe(403);
  });

  it('rejects MCQ with no correct option (400)', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        chapterId,
        type: 'MCQ',
        text: 'No correct option question',
        options: [
          { text: 'A', isCorrect: false },
          { text: 'B', isCorrect: false },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('rejects MCQ with two correct options (400)', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        chapterId,
        type: 'MCQ',
        text: 'Two correct options question',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: true },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('rejects MCQ with fewer than 2 options (400)', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        chapterId,
        type: 'MCQ',
        text: 'Only one option',
        options: [{ text: 'A', isCorrect: true }],
      });
    expect(res.status).toBe(400);
  });

  it('rejects FILL_BLANK without correctAnswerText (400)', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        chapterId,
        type: 'FILL_BLANK',
        text: 'The capital of France is ____',
      });
    expect(res.status).toBe(400);
  });

  it('rejects invalid payload (bad chapterId uuid) with 400', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        chapterId: 'not-a-uuid',
        type: 'MCQ',
        text: 'x',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('allows ADMIN to create a valid MCQ question (unpublished by default)', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        chapterId,
        type: 'MCQ',
        text: 'What is 2+2?',
        explanation: 'Basic addition',
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.isPublished).toBe(false);
    expect(res.body.data.options).toHaveLength(2);
    createdQuestionIds.push(res.body.data.id);
  });

  it('creates a FILL_BLANK question with correctAnswerText', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        chapterId,
        type: 'FILL_BLANK',
        text: 'The capital of France is ____',
        correctAnswerText: 'Paris',
        isPublished: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.correctAnswerText).toBe('Paris');
    createdQuestionIds.push(res.body.data.id);
  });

  it('hides isCorrect/correctAnswerText from student-facing GET but shows them to admin', async () => {
    // publish the MCQ question so students can see it at all
    const mcqId = createdQuestionIds[0];
    await request(app)
      .patch(`/api/v1/questions/${mcqId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isPublished: true });

    const asAdmin = await request(app).get(`/api/v1/questions/${mcqId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.data.options.every((o: { isCorrect?: boolean }) => 'isCorrect' in o)).toBe(true);

    const asStudent = await request(app)
      .get(`/api/v1/questions/${mcqId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(asStudent.status).toBe(200);
    expect(asStudent.body.data.options.every((o: { isCorrect?: boolean }) => !('isCorrect' in o))).toBe(true);
    expect('correctAnswerText' in asStudent.body.data).toBe(false);

    const unauthenticated = await request(app).get(`/api/v1/questions/${mcqId}`);
    expect(unauthenticated.status).toBe(200);
    expect(unauthenticated.body.data.options.every((o: { isCorrect?: boolean }) => !('isCorrect' in o))).toBe(true);

    const fillBlankId = createdQuestionIds[1];
    const fbAsStudent = await request(app)
      .get(`/api/v1/questions/${fillBlankId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(fbAsStudent.status).toBe(200);
    expect('correctAnswerText' in fbAsStudent.body.data).toBe(false);
  });

  it('hides unpublished question from public/student but shows to admin', async () => {
    const mcqId = createdQuestionIds[0];
    await request(app)
      .patch(`/api/v1/questions/${mcqId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isPublished: false });

    const publicGet = await request(app).get(`/api/v1/questions/${mcqId}`);
    expect(publicGet.status).toBe(404);

    const studentGet = await request(app)
      .get(`/api/v1/questions/${mcqId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentGet.status).toBe(404);

    const adminGet = await request(app).get(`/api/v1/questions/${mcqId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(adminGet.status).toBe(200);

    // re-publish for subsequent tests
    await request(app)
      .patch(`/api/v1/questions/${mcqId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isPublished: true });
  });

  it('rejects publish/update/delete from a STUDENT (RBAC)', async () => {
    const mcqId = createdQuestionIds[0];
    const publishRes = await request(app)
      .patch(`/api/v1/questions/${mcqId}/publish`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ isPublished: true });
    expect(publishRes.status).toBe(403);

    const updateRes = await request(app)
      .patch(`/api/v1/questions/${mcqId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ text: 'hacked' });
    expect(updateRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/v1/questions/${mcqId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(deleteRes.status).toBe(403);
  });

  it('updates a question as admin', async () => {
    const mcqId = createdQuestionIds[0];
    const res = await request(app)
      .patch(`/api/v1/questions/${mcqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: 'What is 2+2? (updated)' });
    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('What is 2+2? (updated)');
  });

  describe('pagination and filters', () => {
    const extraIds: string[] = [];

    beforeAll(async () => {
      // Create several more questions with varying type for filter+pagination coverage.
      const specs = ['MCQ', 'MCQ', 'TRUE_FALSE', 'TRUE_FALSE', 'MCQ'] as const;

      for (const [i, type] of specs.entries()) {
        const res = await request(app)
          .post('/api/v1/questions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            chapterId,
            type,
            text: `Pagination filter question #${i}`,
            options: [
              { text: 'True', isCorrect: true },
              { text: 'False', isCorrect: false },
            ],
          });
        expect(res.status).toBe(201);
        extraIds.push(res.body.data.id);
        createdQuestionIds.push(res.body.data.id);
      }
    });

    it('paginates the admin questions list with total/page/pageSize shape', async () => {
      const res = await request(app)
        .get('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ chapterId, page: 1, pageSize: 3 });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page', 1);
      expect(res.body.data).toHaveProperty('pageSize', 3);
      expect(res.body.data.items.length).toBeLessThanOrEqual(3);
      expect(res.body.data.total).toBeGreaterThanOrEqual(7); // 2 original + 5 extra

      const page2 = await request(app)
        .get('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ chapterId, page: 2, pageSize: 3 });
      expect(page2.status).toBe(200);
      expect(page2.body.data.page).toBe(2);
      const page1Ids = res.body.data.items.map((i: { id: string }) => i.id);
      const page2Ids = page2.body.data.items.map((i: { id: string }) => i.id);
      expect(page1Ids.some((id: string) => page2Ids.includes(id))).toBe(false);
    });

    it('filters by type', async () => {
      const res = await request(app)
        .get('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ chapterId, type: 'TRUE_FALSE', pageSize: 50 });
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.items.every((q: { type: string }) => q.type === 'TRUE_FALSE')).toBe(true);
    });

    it('filters by chapterId/subjectId/classId ancestor scoping', async () => {
      const byChapter = await request(app)
        .get('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ chapterId, pageSize: 50 });
      const bySubject = await request(app)
        .get('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ subjectId, pageSize: 50 });
      const byClass = await request(app)
        .get('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ classId, pageSize: 50 });

      expect(byChapter.body.data.total).toBeGreaterThanOrEqual(7);
      expect(byChapter.body.data.total).toBe(bySubject.body.data.total);
      expect(bySubject.body.data.total).toBe(byClass.body.data.total);
    });
  });

  it('deletes a question', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        chapterId,
        type: 'SHORT_ANSWER',
        text: 'Explain recursion.',
      });
    expect(res.status).toBe(201);
    const id = res.body.data.id;

    const del = await request(app).delete(`/api/v1/questions/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(204);

    const getRes = await request(app).get(`/api/v1/questions/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(404);
  });
});
