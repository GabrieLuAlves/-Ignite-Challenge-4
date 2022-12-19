import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuid } from "uuid";
import { app } from "../../../../app";

let connection: Connection;

let user_info: {
  id: string;
  name: string;
  email: string;
  password: string;
};

let statement_info: {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: string;
};

describe("Get Statement Operation", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    user_info = {
      id: uuid(),
      name: "User 01",
      email: "user01@email.com",
      password: await hash("User 01 password", 8),
    };

    statement_info = {
      id: uuid(),
      user_id: user_info.id,
      description: "$800.00 deposit",
      amount: 800.0,
      type: "deposit",
    };

    await connection.query(
      `INSERT INTO
        users(id, name, email, password, created_at, updated_at)
        VALUES
        ('${user_info.id}',
        '${user_info.name}',
        '${user_info.email}',
        '${user_info.password}',
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

  it("should be able to return the data of a given statement", async () => {
    const { body } = await request(app).post("/api/v1/sessions").send({
      email: "user01@email.com",
      password: "User 01 password",
    });

    const { token } = body;

    const { body: statement_data } = await request(app)
      .get(`/api/v1/statements/${statement_info.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(statement_data).toHaveProperty("id");
    expect(statement_data).toHaveProperty("user_id", user_info.id);
    expect(statement_data).toHaveProperty(
      "description",
      statement_info.description
    );
    expect(statement_data).toHaveProperty("amount", "800.00");
    expect(statement_data).toHaveProperty("type", "deposit");
  });
});
