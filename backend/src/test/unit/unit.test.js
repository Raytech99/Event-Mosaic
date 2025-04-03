const request = require("supertest");
const app = require("../../app");
const mongoose = require("mongoose");
const connectDB = require("../../db");

let authToken = null;
let eventId = null;
describe("Login Unit Test", () => {
  beforeAll(async () => {
    await connectDB();
  });

  it("should return 200 for valid login", async () => {
    const response = await request(app).post("/api/auth/login").send({
      emailOrUsername: "UnitTest@example.com",
      password: "123456789",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");

    authToken = response.body.token;
    expect(authToken).toBeDefined();
  });
});

describe("Event Unit Test", () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });
  it("should create an event", async () => {
    if (authToken === null) {
      throw new Error("authToken is null");
    }
    const eventData = {
      name: "Unit Test Event",
      date: "2023-10-01",
      time: "12:00 PM",
      location: "Test Location",
      caption: "This is a unit test event.",
    };
    const response = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${authToken}`)
      .send(eventData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("event");

    eventId = response.body.event._id.$oid;

    expect(eventId).toBeDefined();
  });

  it("should delete an event", async () => {
    if (authToken == null && eventId === null) {
      throw new Error("authToken/eventId is null");
    }
    const response = await request(app)
      .delete(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });
});
