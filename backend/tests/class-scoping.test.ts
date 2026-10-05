import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const stamp = Date.now();
const adminEmail = `scope-admin-${stamp}@example.com`;
const scopedStudentEmail = `scope-student-${stamp}@example.com`;
const unscopedStudentEmail = `scope-nograde-${stamp}@example.com`;

let adminToken: string;
let studentToken: string;
let unscopedStudentToken: string;
let adminId: string;

interface Fixture {
  classId: string;
  subjectId: string;
  chapterId: string;
  questionId: string;
}

let nine: Fixture;
let ten: Fixture;

/** Builds one full Class -> Subject -> Chapter -> Question tree. */
async function buildGrade(label: string, order: number): Promise<Fixture> {
  const cls = await prisma.class.create({
    data: {
      title: `Scope ${label}`,
      slug: `scope-${label.toLowerCase()}-${stamp}`,
      order,
      createdById: adminId,
      isPublished: true,
    },
  });

  const subject = await prisma.subject.create({
    data: {
      classId: cls.id,
      title: `Scope ${label} Subject`,
      slug: `scope-subject-${label.toLowerCase()}-${stamp}`,
      order: 1,
      createdById: adminId,
      isPublished: true,
    },
  });

  const chapter = await prisma.chapter.create({
    data: {
      subjectId: subject.id,
      title: `Scope ${label} Chapter`,
      slug: `scope-chapter-${label.toLowerCase()}-${stamp}`,
      order: 1,
      createdById: adminId,
      isPublished: true,
    },
  });

  const question = await prisma.question.create({
    data: {
      chapterId: chapter.id,
      type: 'SHORT_ANSWER',
      text: `Scope ${label}: explain the core idea of this grade`,
      explanation: `Model answer for ${label}.`,
      isPublished: true,
      createdById: adminId,
    },
  });

  return {
    classId: cls.id,
    subjectId: subject.id,
    chapterId: chapter.id,
    questionId: question.id,
  };
}

function ids(body: { data: { id: string }[] }): string[] {
  return body.data.map((item) => item.id);
}

describe('class scoping: a student only ever sees their own grade', () => {
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
        name: 'Scope Admin',
        passwordHash: await hashPassword('AdminPass123'),
        roleId: adminRole.id,
      },
    });
    adminId = admin.id;

    nine = await buildGrade('Nine', 1);
    ten = await buildGrade('Ten', 2);

    await prisma.user.create({
      data: {
        email: scopedStudentEmail,
        name: 'Scoped Student',
        passwordHash: await hashPassword('StudentPass123'),
        roleId: studentRole.id,
        classId: nine.classId,
      },
    });

    await prisma.user.create({
      data: {
        email: unscopedStudentEmail,
        name: 'No Grade Student',
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
      .send({ email: scopedStudentEmail, password: 'StudentPass123' });
    studentToken = studentLogin.body.data.accessToken;

    const unscopedLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: unscopedStudentEmail, password: 'StudentPass123' });
    unscopedStudentToken = unscopedLogin.body.data.accessToken;
  });

  afterAll(async () => {
    const classIds = [nine.classId, ten.classId];
    await prisma.questionOption.deleteMany({
      where: { question: { chapter: { subject: { classId: { in: classIds } } } } },
    });
    await prisma.question.deleteMany({ where: { chapter: { subject: { classId: { in: classIds } } } } });
    await prisma.chapter.deleteMany({ where: { subject: { classId: { in: classIds } } } });
    await prisma.subject.deleteMany({ where: { classId: { in: classIds } } });
    // Classes first: they reference their creator with onDelete: Restrict,
    // while users reference their class with onDelete: SetNull.
    await prisma.class.deleteMany({ where: { id: { in: classIds } } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, scopedStudentEmail, unscopedStudentEmail] } },
    });
    await prisma.$disconnect();
  });

  it('classes: lists only their class and 404s the other one', async () => {
    const list = await request(app).get('/api/v1/classes').set('Authorization', `Bearer ${studentToken}`);
    expect(list.status).toBe(200);
    expect(ids(list.body)).toEqual([nine.classId]);

    const ownGet = await request(app)
      .get(`/api/v1/classes/${nine.classId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(ownGet.status).toBe(200);

    const otherGet = await request(app)
      .get(`/api/v1/classes/${ten.classId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(otherGet.status).toBe(404);
  });

  it('subjects: forced to their class even when asking for the other one', async () => {
    const list = await request(app).get('/api/v1/subjects').set('Authorization', `Bearer ${studentToken}`);
    expect(list.status).toBe(200);
    expect(ids(list.body)).toContain(nine.subjectId);
    expect(ids(list.body)).not.toContain(ten.subjectId);

    const spoofed = await request(app)
      .get('/api/v1/subjects')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ classId: ten.classId });
    expect(spoofed.status).toBe(200);
    expect(ids(spoofed.body)).not.toContain(ten.subjectId);
    expect(ids(spoofed.body)).toContain(nine.subjectId);

    const otherGet = await request(app)
      .get(`/api/v1/subjects/${ten.subjectId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(otherGet.status).toBe(404);

    const ownGet = await request(app)
      .get(`/api/v1/subjects/${nine.subjectId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(ownGet.status).toBe(200);
  });

  it('chapters: only their grade\'s chapters', async () => {
    const list = await request(app).get('/api/v1/chapters').set('Authorization', `Bearer ${studentToken}`);
    expect(list.status).toBe(200);
    expect(ids(list.body)).toContain(nine.chapterId);
    expect(ids(list.body)).not.toContain(ten.chapterId);

    const spoofed = await request(app)
      .get('/api/v1/chapters')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ subjectId: ten.subjectId });
    expect(spoofed.body.data).toHaveLength(0);

    const otherGet = await request(app)
      .get(`/api/v1/chapters/${ten.chapterId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(otherGet.status).toBe(404);
  });

  it('questions: only their grade, even with another grade\'s classId filter', async () => {
    const list = await request(app)
      .get('/api/v1/questions')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ pageSize: 100 });
    expect(list.status).toBe(200);
    const listedIds = list.body.data.items.map((i: { id: string }) => i.id);
    expect(listedIds).toContain(nine.questionId);
    expect(listedIds).not.toContain(ten.questionId);

    const spoofed = await request(app)
      .get('/api/v1/questions')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ classId: ten.classId, pageSize: 100 });
    expect(spoofed.body.data.items).toHaveLength(0);

    const otherGet = await request(app)
      .get(`/api/v1/questions/${ten.questionId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(otherGet.status).toBe(404);
  });

  it('notes: only their grade', async () => {
    const res = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ pageSize: 100 });
    expect(res.status).toBe(200);
    const listedIds = res.body.data.items.map((i: { id: string }) => i.id);
    expect(listedIds).toContain(nine.questionId);
    expect(listedIds).not.toContain(ten.questionId);

    const spoofed = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ classId: ten.classId, pageSize: 100 });
    expect(spoofed.body.data.items).toHaveLength(0);
  });

  it('an admin still sees both grades', async () => {
    const classes = await request(app).get('/api/v1/classes').set('Authorization', `Bearer ${adminToken}`);
    expect(ids(classes.body)).toEqual(expect.arrayContaining([nine.classId, ten.classId]));

    const subjects = await request(app).get('/api/v1/subjects').set('Authorization', `Bearer ${adminToken}`);
    expect(ids(subjects.body)).toEqual(expect.arrayContaining([nine.subjectId, ten.subjectId]));

    const questions = await request(app)
      .get('/api/v1/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ pageSize: 100 });
    const questionIds = questions.body.data.items.map((i: { id: string }) => i.id);
    expect(questionIds).toEqual(expect.arrayContaining([nine.questionId, ten.questionId]));

    const notes = await request(app)
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ pageSize: 100 });
    const noteIds = notes.body.data.items.map((i: { id: string }) => i.id);
    expect(noteIds).toEqual(expect.arrayContaining([nine.questionId, ten.questionId]));

    const otherClass = await request(app)
      .get(`/api/v1/classes/${ten.classId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(otherClass.status).toBe(200);
  });

  it('a student with no grade yet is not restricted (the UI gate handles them)', async () => {
    const classes = await request(app).get('/api/v1/classes').set('Authorization', `Bearer ${unscopedStudentToken}`);
    expect(ids(classes.body)).toEqual(expect.arrayContaining([nine.classId, ten.classId]));

    const otherClass = await request(app)
      .get(`/api/v1/classes/${ten.classId}`)
      .set('Authorization', `Bearer ${unscopedStudentToken}`);
    expect(otherClass.status).toBe(200);
  });
});
