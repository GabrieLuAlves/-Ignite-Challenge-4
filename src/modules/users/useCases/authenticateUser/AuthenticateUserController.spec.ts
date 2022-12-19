import {
  Connection,
  createConnection,
  createConnections,
  getConnection,
} from "typeorm";
import request from "supertest";
import { app } from "../../../../app";

let connection: Connection;

describe("Authenticate User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: "Sample user",
      email: "sampleuser@email.com",
      password: "Sample user password",
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to authenticate a user", async () => {
    const { body } = await request(app).post("/api/v1/sessions").send({
      email: "sampleuser@email.com",
      password: "Sample user password",
    });

    expect(body).toHaveProperty("token");
    expect(body.user).toHaveProperty("id");
  });
});
