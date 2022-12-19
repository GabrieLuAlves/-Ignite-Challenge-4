import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { app } from "../../../../app";

let connection: Connection;

describe("Show User Profile", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to return the user's informations", async () => {
    await request(app).post("/api/v1/users").send({
      name: "User 01",
      email: "user01@email.com",
      password: "User 01 password",
    });

    const { body } = await request(app).post("/api/v1/sessions").send({
      email: "user01@email.com",
      password: "User 01 password",
    });

    const { token } = body;

    const { body: userInfo } = await request(app)
      .get("/api/v1/profile")
      .send()
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(userInfo).toHaveProperty("id");
    expect(userInfo).toHaveProperty("name", "User 01");
    expect(userInfo).toHaveProperty("email", "user01@email.com");
    expect(userInfo).toHaveProperty("created_at");
    expect(userInfo).toHaveProperty("updated_at");
  });
});
