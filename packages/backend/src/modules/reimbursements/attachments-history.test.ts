import request from "supertest";
import { app } from "../../../app.ts";
import { RequestStatus, UserRole } from "../../generated/prisma";
import {
  auth,
  createCategory,
  createReimbursement,
  createUserAndToken,
} from "../../test/factories.ts";

describe("reimbursement attachments and history", () => {
  it("adds and lists simulated attachments for a draft reimbursement owner", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const category = await createCategory();
    const reimbursement = await createReimbursement(employee.user.id, category.id);

    const created = await request(app)
      .post(`/reimbursements/${reimbursement.id}/attachments`)
      .set(auth(employee.token))
      .send({
        fileName: "receipt.pdf",
        fileUrl: "https://example.com/receipt.pdf",
        fileType: "PDF",
      });

    const listed = await request(app)
      .get(`/reimbursements/${reimbursement.id}/attachments`)
      .set(auth(employee.token));

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      requestId: reimbursement.id,
      fileName: "receipt.pdf",
      fileType: "PDF",
    });
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
  });

  it("rejects invalid attachment file types", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const category = await createCategory();
    const reimbursement = await createReimbursement(employee.user.id, category.id);

    const response = await request(app)
      .post(`/reimbursements/${reimbursement.id}/attachments`)
      .set(auth(employee.token))
      .send({
        fileName: "receipt.exe",
        fileUrl: "https://example.com/receipt.exe",
        fileType: "EXE",
      });

    expect(response.status).toBe(400);
  });

  it("forbids non-owners from adding attachments", async () => {
    const owner = await createUserAndToken(UserRole.EMPLOYEE);
    const other = await createUserAndToken(UserRole.EMPLOYEE);
    const category = await createCategory();
    const reimbursement = await createReimbursement(owner.user.id, category.id);

    const response = await request(app)
      .post(`/reimbursements/${reimbursement.id}/attachments`)
      .set(auth(other.token))
      .send({
        fileName: "receipt.pdf",
        fileUrl: "https://example.com/receipt.pdf",
        fileType: "PDF",
      });

    expect(response.status).toBe(403);
  });

  it("lists audit history for a paid reimbursement flow", async () => {
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

    await request(app)
      .put(`/reimbursements/${created.body.id}`)
      .set(auth(employee.token))
      .send({ description: "Updated taxi" });
    await request(app)
      .post(`/reimbursements/${created.body.id}/submit`)
      .set(auth(employee.token));
    await request(app)
      .post(`/reimbursements/${created.body.id}/approve`)
      .set(auth(manager.token));
    await request(app)
      .post(`/reimbursements/${created.body.id}/pay`)
      .set(auth(finance.token));

    const history = await request(app)
      .get(`/reimbursements/${created.body.id}/history`)
      .set(auth(employee.token));

    expect(history.status).toBe(200);
    expect(history.body.map((entry: { action: string }) => entry.action)).toEqual([
      "CREATED",
      "UPDATED",
      "SUBMITTED",
      "APPROVED",
      "PAID",
    ]);
  });

  it("lists rejected history entries", async () => {
    const employee = await createUserAndToken(UserRole.EMPLOYEE);
    const manager = await createUserAndToken(UserRole.MANAGER);
    const category = await createCategory();
    const reimbursement = await createReimbursement(
      employee.user.id,
      category.id,
      { status: RequestStatus.SUBMITTED }
    );

    await request(app)
      .post(`/reimbursements/${reimbursement.id}/reject`)
      .set(auth(manager.token))
      .send({ rejectionReason: "Missing receipt" });

    const history = await request(app)
      .get(`/reimbursements/${reimbursement.id}/history`)
      .set(auth(employee.token));

    expect(history.status).toBe(200);
    expect(history.body.map((entry: { action: string }) => entry.action)).toContain(
      "REJECTED"
    );
  });
});
