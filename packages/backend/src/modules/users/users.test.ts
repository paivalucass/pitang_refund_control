import request from "supertest";
import { app } from "../../../app.ts";
import { UserRole } from "../../generated/prisma/index";
import { auth, createUserAndToken, uniqueEmail } from "../../test/factories.ts";

describe("users routes", () => {
  it("creates a user and does not expose the password hash", async () => {
    const response = await request(app).post("/users").send({
      name: "Employee",
      email: uniqueEmail("employee"),
      password: "password123",
      role: UserRole.EMPLOYEE,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: "Employee",
      role: UserRole.EMPLOYEE,
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it("returns 409 when email is already registered", async () => {
    const email = uniqueEmail("duplicate");

    await request(app).post("/users").send({
      name: "First",
      email,
      password: "password123",
      role: UserRole.EMPLOYEE,
    });

    const response = await request(app).post("/users").send({
      name: "Second",
      email,
      password: "password123",
      role: UserRole.MANAGER,
    });

    expect(response.status).toBe(409);
  });

  it("returns 400 for invalid user payload", async () => {
    const response = await request(app).post("/users").send({
      name: "",
      email: "invalid",
      password: "123",
      role: "UNKNOWN",
    });

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(expect.any(Array));
  });

  it("lists users for admin", async () => {
    const { token } = await createUserAndToken(UserRole.ADMIN);

    const response = await request(app).get("/users").set(auth(token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].passwordHash).toBeUndefined();
  });

  it("forbids non-admin users from listing users", async () => {
    const { token } = await createUserAndToken(UserRole.EMPLOYEE);

    const response = await request(app).get("/users").set(auth(token));

    expect(response.status).toBe(403);
  });
});
