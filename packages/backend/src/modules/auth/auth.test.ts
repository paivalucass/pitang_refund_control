import request from "supertest";
import { app } from "../../../app.ts";
import { UserRole } from "../../generated/prisma";
import { auth, createUser, createUserAndToken } from "../../test/factories.ts";

describe("auth routes", () => {
  it("logs in with valid credentials and returns a token plus user data", async () => {
    const { user, password } = await createUser(UserRole.EMPLOYEE);

    const response = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: user.id,
      email: user.email,
      role: UserRole.EMPLOYEE,
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("returns 401 for invalid credentials", async () => {
    const { user } = await createUser(UserRole.EMPLOYEE);

    const response = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Credenciais inválidas",
      statusCode: 401,
    });
  });

  it("returns 400 for invalid login payload", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "not-an-email", password: "" });

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(expect.any(Array));
  });

  it("protects private routes without a token", async () => {
    const response = await request(app).get("/categories");

    expect(response.status).toBe(401);
  });

  it("rejects invalid bearer tokens on private routes", async () => {
    const response = await request(app)
      .get("/categories")
      .set(auth("invalid-token"));

    expect(response.status).toBe(401);
  });

  it("allows a valid token on private routes", async () => {
    const { token } = await createUserAndToken(UserRole.EMPLOYEE);

    const response = await request(app).get("/categories").set(auth(token));

    expect(response.status).toBe(200);
  });
});
