import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const stamp = Date.now();
const studentEmail = `grade-student-${stamp}@example.com`;
const registeredEmail = `grade-registered-${stamp}@example.com`;
const adminEmail = `grade-admin-${stamp}@example.com`;

let studentToken: string;
let adminId: string;
let publishedClassId: string;
let otherPublishedClassId: string;
let draftClassId: string;

describe('student grade selection', () => {
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
        name: 'Grade Admin',
        passwordHash: await hashPassword('AdminPass123'),
        roleId: adminRole.id,
      },
    });
    adminId = admin.id;

    await prisma.user.create({
      data: {
        email: studentEmail,
        name: 'Grade Student',
        passwordHash: await hashPassword('StudentPass123'),
        roleId: studentRole.id,
      },
    });

    const published = await prisma.class.create({
      data: { title: 'Grade Gate 9', slug: `grade-gate-9-${stamp}`, order: 1, createdById: adminId, isPublished: true },
    });
    publishedClassId = published.id;

    const otherPublished = await prisma.class.create({
      data: {
        title: 'Grade Gate 10',
        slug: `grade-gate-10-${stamp}`,
        order: 2,
        createdById: adminId,
        isPublished: true,
      },
    });
    otherPublishedClassId = otherPublished.id;

    const draft = await prisma.class.create({
      data: {
        title: 'Grade Gate Draft',
        slug: `grade-gate-draft-${stamp}`,
        order: 3,
        createdById: adminId,
        isPublished: false,
      },
    });
    draftClassId = draft.id;

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: studentEmail, password: 'StudentPass123' });
    studentToken = studentLogin.body.data.accessToken;
  });

  afterAll(async () => {
    // Classes first: they reference their creator with onDelete: Restrict,
    // while users reference their class with onDelete: SetNull.
    await prisma.class.deleteMany({ where: { id: { in: [publishedClassId, otherPublishedClassId, draftClassId] } } });
    await prisma.user.deleteMany({ where: { email: { in: [studentEmail, registeredEmail, adminEmail] } } });
    await prisma.$disconnect();
  });

  it('reports classId: null and class: null for a student who has not picked a grade', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.classId).toBeNull();
    expect(res.body.data.class).toBeNull();
    expect('passwordHash' in res.body.data).toBe(false);
  });

  it('requires authentication to set a grade', async () => {
    const res = await request(app).patch('/api/v1/auth/me/class').send({ classId: publishedClassId });
    expect(res.status).toBe(401);
  });

  it('rejects a non-existent class', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me/class')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ classId: '11111111-1111-1111-1111-111111111111' });
    expect(res.status).toBe(400);
  });

  it('rejects an unpublished class', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me/class')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ classId: draftClassId });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed classId', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me/class')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ classId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });

  it('sets the grade and returns the user in the /auth/me shape', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me/class')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ classId: publishedClassId });

    expect(res.status).toBe(200);
    expect(res.body.data.classId).toBe(publishedClassId);
    expect(res.body.data.class).toEqual({ id: publishedClassId, title: 'Grade Gate 9' });
    expect('passwordHash' in res.body.data).toBe(false);

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${studentToken}`);
    expect(me.body.data.classId).toBe(publishedClassId);
    expect(me.body.data.class).toEqual({ id: publishedClassId, title: 'Grade Gate 9' });
  });

  it('allows changing the grade later', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me/class')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ classId: otherPublishedClassId });

    expect(res.status).toBe(200);
    expect(res.body.data.classId).toBe(otherPublishedClassId);

    const stored = await prisma.user.findUnique({ where: { email: studentEmail } });
    expect(stored?.classId).toBe(otherPublishedClassId);
  });

  it('stores an optional classId at registration and reports it on login and /auth/me', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Registered With Grade',
      email: registeredEmail,
      password: 'StrongPass123',
      classId: publishedClassId,
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.classId).toBe(publishedClassId);
    expect(registerRes.body.data.class).toEqual({ id: publishedClassId, title: 'Grade Gate 9' });
    expect('passwordHash' in registerRes.body.data).toBe(false);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: registeredEmail, password: 'StrongPass123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.classId).toBe(publishedClassId);
    expect(loginRes.body.data.user.class).toEqual({ id: publishedClassId, title: 'Grade Gate 9' });

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);
    expect(me.body.data.classId).toBe(publishedClassId);
  });

  it('rejects registration with an unpublished classId', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Bad Grade',
      email: `grade-bad-${stamp}@example.com`,
      password: 'StrongPass123',
      classId: draftClassId,
    });
    expect(res.status).toBe(400);
  });
});
