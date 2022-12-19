import { hash } from "bcryptjs";
import { Connection, createConnection, getRepository } from "typeorm";
import request from "supertest";

import { v4 as uuid } from "uuid";
import { app } from "../../../../app";
import { Statement } from "../../entities/Statement";
import { User } from "../../../users/entities/User";

let connection: Connection;

// The user for testing
let user_info: {
  id: string;
  name: string;
  email: string;
  password: string;
} = {
  id: uuid(),
  name: "User 01",
  email: "user01@email.com",
  password: "User 01 password",
};

describe("Create Statement Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    // Register user
    await connection.query(
      `INSERT INTO users (id, name, email, password, created_at, updated_at)
      VALUES (
        '${user_info.id}',
        '${user_info.name}',
        '${user_info.email}',
        '${await hash(user_info.password, 8)}',
        now(),
        now()
      );`
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create a new statement", async () => {
    const { body } = await request(app).post("/api/v1/sessions").send({
      email: user_info.email,
      password: user_info.password,
    });

    const { token, user } = body;

    const deposit_response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 800.0,
        description: "$800.00 deposit",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const withdraw_response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 600.0,
        description: "$600.00 withdraw",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const [deposit] = await connection.getRepository(Statement).find({
      where: {
        id: deposit_response.body.id,
      },
    });

    const [withdraw] = await connection.getRepository(Statement).find({
      where: {
        id: withdraw_response.body.id,
      },
    });

    expect(deposit).not.toBeUndefined();
    expect(withdraw).not.toBeUndefined();

    expect(deposit).toHaveProperty("id");
    expect(deposit).toHaveProperty("user_id", user.id);
    expect(deposit).toHaveProperty("description", "$800.00 deposit");
    expect(deposit).toHaveProperty("amount", "800.00");
    expect(deposit).toHaveProperty("type", "deposit");

    expect(withdraw).toHaveProperty("id");
    expect(withdraw).toHaveProperty("user_id", user.id);
    expect(withdraw).toHaveProperty("description", "$600.00 withdraw");
    expect(withdraw).toHaveProperty("amount", "600.00");
    expect(withdraw).toHaveProperty("type", "withdraw");
  });
});
