import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuid } from "uuid";
import { app } from "../../../../app";

let connection: Connection;

let user_info = {
  id: uuid(),
  name: "User 01",
  email: "user01@email.com",
  password: "User 01 password",
};

let statement_info = {
  id: uuid(),
  user_id: user_info.id,
  description: "$800.00 deposit",
  amount: 800.0,
  type: "deposit",
};

describe("Get Balance", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    await connection.query(
      `INSERT INTO
        users(id, name, email, password, created_at, updated_at)
        VALUES
        ('${user_info.id}',
        '${user_info.name}',
        '${user_info.email}',
        '${await hash(user_info.password, 8)}',
        now(),
        now());`
    );

    await connection.query(
      `INSERT INTO
        statements(id, user_id, description, amount, type, created_at, updated_at) 
        VALUES
        ('${statement_info.id}',
        '${statement_info.user_id}',
        '${statement_info.description}',
        ${statement_info.amount},
        '${statement_info.type}',
        now(),
        now());`
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to return the users balance", async () => {
    const session_response = await request(app).post("/api/v1/sessions").send({
      email: user_info.email,
      password: user_info.password,
    });

    const { token, user } = session_response.body;

    const balance_response = await request(app)
      .get("/api/v1/statements/balance")
      .send()
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(balance_response.body).toMatchObject({
      statement: [
        {
          amount: 800,
          description: "$800.00 deposit",
          type: "deposit",
        },
      ],
      balance: 800,
    });
  });
});
