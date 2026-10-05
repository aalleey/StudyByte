import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

const app = createApp();

const adminEmail = `crud-admin-${Date.now()}@example.com`;
const studentEmail = `crud-student-${Date.now()}@example.com`;
const classSlug = `crud-test-class-${Date.now()}`;

let adminToken: string;
let studentToken: string;
let createdClassId: string;

describe('content CRUD (classes) + RBAC', () => {
  beforeAll(async () => {
    const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
    const studentRole = await prisma.role.upsert({
      where: { name: 'STUDENT' },
      update: {},
      create: { name: 'STUDENT' },
    });

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'CRUD Admin',
        passwordHash: await hashPassword('AdminPass123'),
        roleId: adminRole.id,
      },
    });
    await prisma.user.create({
      data: {
        email: studentEmail,
        name: 'CRUD Student',
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
  });

  afterAll(async () => {
    await prisma.class.deleteMany({ where: { slug: classSlug } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, studentEmail] } } });
    await prisma.$disconnect();
  });

  it('rejects unauthenticated create', async () => {
    const res = await request(app).post('/api/v1/classes').send({ title: 'X', slug: classSlug, order: 1 });
    expect(res.status).toBe(401);
  });

  it('rejects create from a STUDENT (RBAC)', async () => {
    const res = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'X', slug: classSlug, order: 1 });
    expect(res.status).toBe(403);
  });

  it('rejects invalid payload with 400', async () => {
    const res = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'X', slug: 'Not A Valid Slug', order: 1 });
    expect(res.status).toBe(400);
  });

  it('allows ADMIN to create a class', async () => {
    const res = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'CRUD Test Class', slug: classSlug, order: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe(classSlug);
    expect(res.body.data.isPublished).toBe(false);
    createdClassId = res.body.data.id;
  });

  it('rejects duplicate slug with 409', async () => {
    const res = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Another Title', slug: classSlug, order: 2 });
    expect(res.status).toBe(409);
  });

  it('hides unpublished class from public listing but shows it to admin', async () => {
    const publicList = await request(app).get('/api/v1/classes');
    expect(publicList.body.data.find((c: { id: string }) => c.id === createdClassId)).toBeUndefined();

    const adminList = await request(app).get('/api/v1/classes').set('Authorization', `Bearer ${adminToken}`);
    expect(adminList.body.data.find((c: { id: string }) => c.id === createdClassId)).toBeDefined();
  });

  it('returns 404 for an unpublished class on the public getOne route', async () => {
    const res = await request(app).get(`/api/v1/classes/${createdClassId}`);
    expect(res.status).toBe(404);
  });

  it('publishes the class and makes it publicly visible', async () => {
    const publishRes = await request(app)
      .patch(`/api/v1/classes/${createdClassId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isPublished: true });
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.isPublished).toBe(true);

    const publicGet = await request(app).get(`/api/v1/classes/${createdClassId}`);
    expect(publicGet.status).toBe(200);
  });

  it('updates the class', async () => {
    const res = await request(app)
      .patch(`/api/v1/classes/${createdClassId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('deletes the class', async () => {
    const res = await request(app)
      .delete(`/api/v1/classes/${createdClassId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/v1/classes/${createdClassId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(404);
  });

  it('exposes admin dashboard stats to ADMIN only', async () => {
    const forbidden = await request(app)
      .get('/api/v1/dashboard/admin')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(forbidden.status).toBe(403);

    const ok = await request(app).get('/api/v1/dashboard/admin').set('Authorization', `Bearer ${adminToken}`);
    expect(ok.status).toBe(200);
    expect(typeof ok.body.data.totalClasses).toBe('number');
  });
});
