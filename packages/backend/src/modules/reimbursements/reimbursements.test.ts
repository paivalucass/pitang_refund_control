import request from "supertest";
import { app } from "../../../app.ts";
import { RequestStatus, UserRole } from "../../generated/prisma/index";
import {
  auth,
  createCategory,
  createReimbursement,
  createUserAndToken,
} from "../../test/factories.ts";

describe("reimbursements routes", () => {
  it("creates a draft reimbursement for an employee", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const category = await createCategory();

    const response = await request(app)
      .post("/reimbursements")
      .set(auth(employee.token))
      .send({
        categoryId: category.id,
        description: "Lunch with client",
        amount: 55.75,
        expenseDate: "2026-04-20T12:00:00.000Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      requesterId: employee.user.id,
      categoryId: category.id,
      description: "Lunch with client",
      status: RequestStatus.DRAFT,
    });
  });

  it("rejects reimbursement creation with an inactive category", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const category = await createCategory({ active: false });

    const response = await request(app)
      .post("/reimbursements")
      .set(auth(employee.token))
      .send({
        categoryId: category.id,
        description: "Lunch",
        amount: 10,
        expenseDate: "2026-04-20T12:00:00.000Z",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Categoria não encontrada ou inativa");
  });

  it("updates only draft reimbursements owned by the employee", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const category = await createCategory();
    const reimbursement = await createReimbursement(employee.user.id, category.id);

    const response = await request(app)
      .put(`/reimbursements/${reimbursement.id}`)
      .set(auth(employee.token))
      .send({ description: "Updated description", amount: 99.9 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: reimbursement.id,
      description: "Updated description",
      status: RequestStatus.DRAFT,
    });
  });

  it("forbids employees from updating another user's reimbursement", async () => {
    const owner = await createUserAndToken(UserRole.EMPLOYEE);
    const other = await createUserAndToken(UserRole.EMPLOYEE);
    const category = await createCategory();
    const reimbursement = await createReimbursement(owner.user.id, category.id);

    const response = await request(app)
      .put(`/reimbursements/${reimbursement.id}`)
      .set(auth(other.token))
      .send({ description: "Not allowed" });

    expect(response.status).toBe(403);
  });

  it("submits, approves, and pays a reimbursement through the expected roles", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const manager = await createUserAndToken(UserRole.MANAGER);
    const finance = await createUserAndToken(UserRole.FINANCE);
    const category = await createCategory();

    const created = await request(app)
      .post("/reimbursements")
      .set(auth(employee.token))
      .send({
        categoryId: category.id,
        description: "Taxi",
        amount: 42.5,
        expenseDate: "2026-04-20T12:00:00.000Z",
      });

    const submitted = await request(app)
      .post(`/reimbursements/${created.body.id}/submit`)
      .set(auth(employee.token));

    const approved = await request(app)
      .post(`/reimbursements/${created.body.id}/approve`)
      .set(auth(manager.token));

    const paid = await request(app)
      .post(`/reimbursements/${created.body.id}/pay`)
      .set(auth(finance.token));

    expect(submitted.status).toBe(200);
    expect(submitted.body.status).toBe(RequestStatus.SUBMITTED);
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe(RequestStatus.APPROVED);
    expect(paid.status).toBe(200);
    expect(paid.body.status).toBe(RequestStatus.PAID);
  });

  it("rejects submitted reimbursements with a required reason", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const manager = await createUserAndToken(UserRole.MANAGER);
    const category = await createCategory();
    const reimbursement = await createReimbursement(
      employee.user.id,
      category.id,
      { status: RequestStatus.SUBMITTED }
    );

    const invalid = await request(app)
      .post(`/reimbursements/${reimbursement.id}/reject`)
      .set(auth(manager.token))
      .send({ rejectionReason: "" });

    const valid = await request(app)
      .post(`/reimbursements/${reimbursement.id}/reject`)
      .set(auth(manager.token))
      .send({ rejectionReason: "Missing receipt" });

    expect(invalid.status).toBe(400);
    expect(valid.status).toBe(200);
    expect(valid.body).toMatchObject({
      status: RequestStatus.REJECTED,
      rejectionReason: "Missing receipt",
    });
  });

  it("blocks invalid status transitions", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const finance = await createUserAndToken(UserRole.FINANCE);
    const category = await createCategory();
    const reimbursement = await createReimbursement(
      employee.user.id,
      category.id,
      { status: RequestStatus.SUBMITTED }
    );

    const response = await request(app)
      .post(`/reimbursements/${reimbursement.id}/pay`)
      .set(auth(finance.token));

    expect(response.status).toBe(400);
  });

  it("cancels draft reimbursements owned by the employee", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const category = await createCategory();
    const reimbursement = await createReimbursement(employee.user.id, category.id);

    const response = await request(app)
      .post(`/reimbursements/${reimbursement.id}/cancel`)
      .set(auth(employee.token));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(RequestStatus.CANCELED);
  });

  it("lists reimbursements according to role visibility", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const manager = await createUserAndToken(UserRole.MANAGER);
    const finance = await createUserAndToken(UserRole.FINANCE);
    const admin = await createUserAndToken(UserRole.ADMIN);
    const category = await createCategory();

    const draft = await createReimbursement(employee.user.id, category.id);
    const submitted = await createReimbursement(employee.user.id, category.id, {
      status: RequestStatus.SUBMITTED,
    });
    const approved = await createReimbursement(employee.user.id, category.id, {
      status: RequestStatus.APPROVED,
    });

    const employeeList = await request(app)
      .get("/reimbursements")
      .set(auth(employee.token));
    const managerList = await request(app)
      .get("/reimbursements")
      .set(auth(manager.token));
    const financeList = await request(app)
      .get("/reimbursements")
      .set(auth(finance.token));
    const adminList = await request(app)
      .get("/reimbursements")
      .set(auth(admin.token));

    expect(employeeList.body.map((item: { id: string }) => item.id)).toEqual(
      expect.arrayContaining([draft.id, submitted.id, approved.id])
    );
    expect(managerList.body.map((item: { id: string }) => item.id)).toEqual([
      submitted.id,
    ]);
    expect(financeList.body.map((item: { id: string }) => item.id)).toEqual([
      approved.id,
    ]);
    expect(adminList.body).toHaveLength(3);
  });
});
