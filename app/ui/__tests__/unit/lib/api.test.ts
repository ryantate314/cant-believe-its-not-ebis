import { describe, it, expect } from "vitest";
import { citiesApi, workOrdersApi, workOrderItemsApi, ApiError } from "@/lib/api";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

describe("citiesApi", () => {
  describe("list", () => {
    it("should fetch active cities by default", async () => {
      const result = await citiesApi.list();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.items[0].code).toBe("KTYS");
    });

    it("should fetch all cities when activeOnly is false", async () => {
      const result = await citiesApi.list(false);

      expect(result.items).toHaveLength(2);
    });
  });

  describe("get", () => {
    it("should fetch a city by id", async () => {
      const result = await citiesApi.get("city-uuid-1");

      expect(result.id).toBe("city-uuid-1");
      expect(result.code).toBe("KTYS");
      expect(result.name).toBe("Knoxville McGhee Tyson");
    });

    it("should throw ApiError when city not found", async () => {
      await expect(citiesApi.get("nonexistent-id")).rejects.toThrow(ApiError);
      await expect(citiesApi.get("nonexistent-id")).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});

describe("workOrdersApi", () => {
  describe("list", () => {
    it("should fetch work orders for a city", async () => {
      const result = await workOrdersApi.list({ city_id: "city-uuid-1" });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.page_size).toBe(20);
    });

    it("should support pagination", async () => {
      const result = await workOrdersApi.list({
        city_id: "city-uuid-1",
        page: 1,
        page_size: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.page_size).toBe(1);
    });

    it("should support search", async () => {
      const result = await workOrdersApi.list({
        city_id: "city-uuid-1",
        search: "KTYS00001",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].work_order_number).toBe("KTYS00001-01-2026");
    });

    it("should support status filter", async () => {
      const result = await workOrdersApi.list({
        city_id: "city-uuid-1",
        status: "created",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe("created");
    });

    it("should return empty list for non-existent city", async () => {
      const result = await workOrdersApi.list({ city_id: "nonexistent-id" });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("get", () => {
    it("should fetch a work order by id", async () => {
      const result = await workOrdersApi.get("wo-uuid-1");

      expect(result.id).toBe("wo-uuid-1");
      expect(result.work_order_number).toBe("KTYS00001-01-2026");
      expect(result.customer?.name).toBe("Acme Corp");
    });

    it("should throw ApiError when work order not found", async () => {
      await expect(workOrdersApi.get("nonexistent-id")).rejects.toThrow(
        ApiError
      );
    });
  });

  describe("create", () => {
    it("should create a work order with minimal data", async () => {
      const result = await workOrdersApi.create({
        city_id: "city-uuid-1",
        aircraft_id: "aircraft-uuid-1",
        created_by: "test_user",
      });

      expect(result.id).toBeDefined();
      expect(result.work_order_number).toMatch(/^KTYS\d{5}-\d{2}-\d{4}$/);
      expect(result.status).toBe("created");
      expect(result.priority).toBe("normal");
      expect(result.created_by).toBe("test_user");
      expect(result.aircraft.registration_number).toBe("N12345");
    });

    it("should create a work order with all fields", async () => {
      const result = await workOrdersApi.create({
        city_id: "city-uuid-1",
        aircraft_id: "aircraft-uuid-2",
        created_by: "test_user",
        work_order_type: "quote",
        status: "open",
        priority: "high",
      });

      expect(result.work_order_type).toBe("quote");
      expect(result.status).toBe("open");
      expect(result.customer?.name).toBe("Beta Aviation LLC");
      expect(result.priority).toBe("high");
      expect(result.aircraft.registration_number).toBe("N67890");
    });

    it("should throw ApiError when city not found", async () => {
      await expect(
        workOrdersApi.create({
          city_id: "nonexistent-id",
          aircraft_id: "aircraft-uuid-1",
          created_by: "test_user",
        })
      ).rejects.toThrow(ApiError);
    });

    it("should throw ApiError when aircraft not found", async () => {
      await expect(
        workOrdersApi.create({
          city_id: "city-uuid-1",
          aircraft_id: "nonexistent-id",
          created_by: "test_user",
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("update", () => {
    it("should update work order status", async () => {
      const result = await workOrdersApi.update("wo-uuid-1", {
        status: "in_progress",
      });

      expect(result.status).toBe("in_progress");
    });

    it("should update multiple fields", async () => {
      const result = await workOrdersApi.update("wo-uuid-1", {
        status: "open",
        priority: "urgent",
        updated_by: "admin",
      });

      expect(result.status).toBe("open");
      expect(result.priority).toBe("urgent");
    });

    it("should throw ApiError when work order not found", async () => {
      await expect(
        workOrdersApi.update("nonexistent-id", { status: "open" })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("delete", () => {
    it("should delete a work order", async () => {
      await expect(workOrdersApi.delete("wo-uuid-1")).resolves.toBeUndefined();
    });

    it("should throw ApiError when work order not found", async () => {
      await expect(workOrdersApi.delete("nonexistent-id")).rejects.toThrow(
        ApiError
      );
    });
  });
});

describe("workOrderItemsApi", () => {
  describe("list", () => {
    it("should fetch items for a work order", async () => {
      const result = await workOrderItemsApi.list("wo-uuid-1");

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should throw ApiError when work order not found", async () => {
      await expect(workOrderItemsApi.list("nonexistent-id")).rejects.toThrow(
        ApiError
      );
    });
  });

  describe("get", () => {
    it("should fetch an item by id", async () => {
      const result = await workOrderItemsApi.get("wo-uuid-1", "item-uuid-1");

      expect(result.id).toBe("item-uuid-1");
      expect(result.discrepancy).toBe("Engine vibration detected");
    });

    it("should throw ApiError when item not found", async () => {
      await expect(
        workOrderItemsApi.get("wo-uuid-1", "nonexistent-id")
      ).rejects.toThrow(ApiError);
    });
  });

  describe("create", () => {
    it("should create an item with minimal data", async () => {
      const result = await workOrderItemsApi.create("wo-uuid-1", {
        created_by: "tech_user",
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe("open");
      expect(result.billing_method).toBe("hourly");
      expect(result.created_by).toBe("tech_user");
    });

    it("should create an item with all fields", async () => {
      const result = await workOrderItemsApi.create("wo-uuid-1", {
        created_by: "tech_user",
        status: "in_progress",
        discrepancy: "Test discrepancy",
        corrective_action: "Test action",
        category: "Avionics",
        hours_estimate: 3.5,
        enable_rii: true,
      });

      expect(result.status).toBe("in_progress");
      expect(result.discrepancy).toBe("Test discrepancy");
      expect(result.enable_rii).toBe(true);
    });

    it("should throw ApiError when work order not found", async () => {
      await expect(
        workOrderItemsApi.create("nonexistent-id", { created_by: "user" })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("update", () => {
    it("should update item status", async () => {
      const result = await workOrderItemsApi.update(
        "wo-uuid-1",
        "item-uuid-1",
        { status: "finished" }
      );

      expect(result.status).toBe("finished");
    });

    it("should throw ApiError when item not found", async () => {
      await expect(
        workOrderItemsApi.update("wo-uuid-1", "nonexistent-id", {
          status: "finished",
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("delete", () => {
    it("should delete an item", async () => {
      await expect(
        workOrderItemsApi.delete("wo-uuid-1", "item-uuid-1")
      ).resolves.toBeUndefined();
    });

    it("should throw ApiError when item not found", async () => {
      await expect(
        workOrderItemsApi.delete("wo-uuid-1", "nonexistent-id")
      ).rejects.toThrow(ApiError);
    });
  });
});

describe("ApiError", () => {
  it("should be an instance of Error", () => {
    const error = new ApiError(404, "Not found");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
  });

  it("should have status and message", () => {
    const error = new ApiError(500, "Server error");
    expect(error.status).toBe(500);
    expect(error.message).toBe("Server error");
  });
});

describe("error handling", () => {
  it("should handle network errors", async () => {
    server.use(
      http.get("/api/cities", () => {
        return HttpResponse.error();
      })
    );

    await expect(citiesApi.list()).rejects.toThrow();
  });

  it("should handle non-JSON error responses", async () => {
    server.use(
      http.get("/api/cities", () => {
        return new HttpResponse("Internal Server Error", { status: 500 });
      })
    );

    await expect(citiesApi.list()).rejects.toThrow(ApiError);
  });
});
