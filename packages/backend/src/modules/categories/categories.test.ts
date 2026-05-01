import request from "supertest";
import { app } from "../../../app.ts";
import { UserRole } from "../../generated/prisma/index";
import {
  auth,
  createCategory,
  createUserAndToken,
} from "../../test/factories.ts";

describe("categories routes", () => {
  it("lists categories for authenticated users", async () => {
    const { token } = await createUserAndToken(UserRole.EMPLOYEE);
    await createCategory({ name: "Meals" });

    const response = await request(app).get("/categories").set(auth(token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ name: "Meals", active: true });
  });

  it("creates categories for admin users", async () => {
    const { token } = await createUserAndToken(UserRole.ADMIN);

    const response = await request(app)
      .post("/categories")
      .set(auth(token))
      .send({ name: "Transport" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: "Transport", active: true });
  });

  it("updates categories for admin users", async () => {
    const { token } = await createUserAndToken(UserRole.ADMIN);
    const category = await createCategory({ name: "Old name" });

    const response = await request(app)
      .put(`/categories/${category.id}`)
      .set(auth(token))
      .send({ name: "New name", active: false });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: "New name", active: false });
  });

  it("forbids category creation for non-admin users", async () => {
    const { token } = await createUserAndToken(UserRole.EMPLOYEE);

    const response = await request(app)
      .post("/categories")
      .set(auth(token))
      .send({ name: "Meals" });

    expect(response.status).toBe(403);
  });

  it("returns 409 for duplicate category names", async () => {
    const { token } = await createUserAndToken(UserRole.ADMIN);
    await createCategory({ name: "Meals" });

    const response = await request(app)
      .post("/categories")
      .set(auth(token))
      .send({ name: "Meals" });

    expect(response.status).toBe(409);
  });
});
