import { app } from "../../../../app";
import "../../../../database";

import request from "supertest";
import { Connection, createConnection, getConnection } from "typeorm";
import { User } from "../../entities/User";

let connection: Connection;

describe("Create User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create a user", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "User 01",
      email: "user01@email.com",
      password: "User 01 password",
    });

    expect(response.status).toEqual(201);

    const allUsers = await connection.getRepository(User).find();

    expect(allUsers).toHaveLength(1);
  });
});
