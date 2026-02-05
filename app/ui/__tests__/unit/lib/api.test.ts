import { describe, it, expect } from "vitest";
import {
  listCities,
  getCity,
  listWorkOrders,
  getWorkOrder,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  listWorkOrderItems,
  getWorkOrderItem,
  createWorkOrderItem,
  updateWorkOrderItem,
  deleteWorkOrderItem,
  ApiError,
} from "@/lib/api";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

describe("citiesApi", () => {
  describe("list", () => {
    it("should fetch active cities by default", async () => {
      const result = await listCities();

      expect(result.data.items).toHaveLength(2);
      expect(result.data.total).toBe(2);
      expect(result.data.items[0].code).toBe("KTYS");
    });

    it("should fetch all cities when active_only is false", async () => {
      const result = await listCities({ active_only: false });

      expect(result.data.items).toHaveLength(2);
    });
  });

  describe("get", () => {
    it("should fetch a city by id", async () => {
      const result = await getCity("city-uuid-1");

      expect(result.data.id).toBe("city-uuid-1");
      expect(result.data.code).toBe("KTYS");
      expect(result.data.name).toBe("Knoxville McGhee Tyson");
    });

    it("should throw ApiError when city not found", async () => {
      await expect(getCity("nonexistent-id")).rejects.toThrow(ApiError);
      await expect(getCity("nonexistent-id")).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});

describe("workOrdersApi", () => {
  describe("list", () => {
    it("should fetch work orders for a city", async () => {
      const result = await listWorkOrders({ city_id: "city-uuid-1" });

      expect(result.data.items).toHaveLength(2);
      expect(result.data.total).toBe(2);
      expect(result.data.page).toBe(1);
      expect(result.data.page_size).toBe(20);
    });

    it("should support pagination", async () => {
      const result = await listWorkOrders({
        city_id: "city-uuid-1",
        page: 1,
        page_size: 1,
      });

      expect(result.data.items).toHaveLength(1);
      expect(result.data.page).toBe(1);
      expect(result.data.page_size).toBe(1);
    });

    it("should support search", async () => {
      const result = await listWorkOrders({
        city_id: "city-uuid-1",
        search: "KTYS00001",
      });

      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].work_order_number).toBe("KTYS00001-01-2026");
    });

    it("should support status filter", async () => {
      const result = await listWorkOrders({
        city_id: "city-uuid-1",
        status: "created",
      });

      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].status).toBe("created");
    });

    it("should return empty list for non-existent city", async () => {
      const result = await listWorkOrders({ city_id: "nonexistent-id" });

      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe("get", () => {
    it("should fetch a work order by id", async () => {
      const result = await getWorkOrder("wo-uuid-1");

      expect(result.data.id).toBe("wo-uuid-1");
      expect(result.data.work_order_number).toBe("KTYS00001-01-2026");
      expect(result.data.customer_name).toBe("Test Customer");
    });

    it("should throw ApiError when work order not found", async () => {
      await expect(getWorkOrder("nonexistent-id")).rejects.toThrow(
        ApiError
      );
    });
  });

  describe("create", () => {
    it("should create a work order with minimal data", async () => {
      const result = await createWorkOrder({
        city_id: "city-uuid-1",
        aircraft_id: "aircraft-uuid-1",
        created_by: "test_user",
      });

      expect(result.data.id).toBeDefined();
      expect(result.data.work_order_number).toMatch(/^KTYS\d{5}-\d{2}-\d{4}$/);
      expect(result.data.status).toBe("created");
      expect(result.data.priority).toBe("normal");
      expect(result.data.created_by).toBe("test_user");
      expect(result.data.aircraft.registration_number).toBe("N12345");
    });

    it("should create a work order with all fields", async () => {
      const result = await createWorkOrder({
        city_id: "city-uuid-1",
        aircraft_id: "aircraft-uuid-2",
        created_by: "test_user",
        work_order_type: "quote",
        status: "open",
        customer_name: "New Customer",
        priority: "high",
      });

      expect(result.data.work_order_type).toBe("quote");
      expect(result.data.status).toBe("open");
      expect(result.data.customer_name).toBe("New Customer");
      expect(result.data.priority).toBe("high");
      expect(result.data.aircraft.registration_number).toBe("N67890");
    });

    it("should throw ApiError when city not found", async () => {
      await expect(
        createWorkOrder({
          city_id: "nonexistent-id",
          aircraft_id: "aircraft-uuid-1",
          created_by: "test_user",
        })
      ).rejects.toThrow(ApiError);
    });

    it("should throw ApiError when aircraft not found", async () => {
      await expect(
        createWorkOrder({
          city_id: "city-uuid-1",
          aircraft_id: "nonexistent-id",
          created_by: "test_user",
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("update", () => {
    it("should update work order status", async () => {
      const result = await updateWorkOrder("wo-uuid-1", {
        status: "in_progress",
      });

      expect(result.data.status).toBe("in_progress");
    });

    it("should update multiple fields", async () => {
      const result = await updateWorkOrder("wo-uuid-1", {
        status: "open",
        customer_name: "Updated Customer",
        priority: "urgent",
        updated_by: "admin",
      });

      expect(result.data.status).toBe("open");
      expect(result.data.customer_name).toBe("Updated Customer");
      expect(result.data.priority).toBe("urgent");
    });

    it("should throw ApiError when work order not found", async () => {
      await expect(
        updateWorkOrder("nonexistent-id", { status: "open" })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("delete", () => {
    it("should delete a work order", async () => {
      await expect(deleteWorkOrder("wo-uuid-1")).resolves.toBeDefined();
    });

    it("should throw ApiError when work order not found", async () => {
      await expect(deleteWorkOrder("nonexistent-id")).rejects.toThrow(
        ApiError
      );
    });
  });
});

describe("workOrderItemsApi", () => {
  describe("list", () => {
    it("should fetch items for a work order", async () => {
      const result = await listWorkOrderItems("wo-uuid-1");

      expect(result.data.items).toHaveLength(2);
      expect(result.data.total).toBe(2);
    });

    it("should throw ApiError when work order not found", async () => {
      await expect(listWorkOrderItems("nonexistent-id")).rejects.toThrow(
        ApiError
      );
    });
  });

  describe("get", () => {
    it("should fetch an item by id", async () => {
      const result = await getWorkOrderItem("wo-uuid-1", "item-uuid-1");

      expect(result.data.id).toBe("item-uuid-1");
      expect(result.data.discrepancy).toBe("Engine vibration detected");
    });

    it("should throw ApiError when item not found", async () => {
      await expect(
        getWorkOrderItem("wo-uuid-1", "nonexistent-id")
      ).rejects.toThrow(ApiError);
    });
  });

  describe("create", () => {
    it("should create an item with minimal data", async () => {
      const result = await createWorkOrderItem("wo-uuid-1", {
        created_by: "tech_user",
      });

      expect(result.data.id).toBeDefined();
      expect(result.data.status).toBe("open");
      expect(result.data.billing_method).toBe("hourly");
      expect(result.data.created_by).toBe("tech_user");
    });

    it("should create an item with all fields", async () => {
      const result = await createWorkOrderItem("wo-uuid-1", {
        created_by: "tech_user",
        status: "in_progress",
        discrepancy: "Test discrepancy",
        corrective_action: "Test action",
        category: "Avionics",
        hours_estimate: 3.5,
        enable_rii: true,
      });

      expect(result.data.status).toBe("in_progress");
      expect(result.data.discrepancy).toBe("Test discrepancy");
      expect(result.data.enable_rii).toBe(true);
    });

    it("should throw ApiError when work order not found", async () => {
      await expect(
        createWorkOrderItem("nonexistent-id", { created_by: "user" })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("update", () => {
    it("should update item status", async () => {
      const result = await updateWorkOrderItem(
        "wo-uuid-1",
        "item-uuid-1",
        { status: "finished" }
      );

      expect(result.data.status).toBe("finished");
    });

    it("should throw ApiError when item not found", async () => {
      await expect(
        updateWorkOrderItem("wo-uuid-1", "nonexistent-id", {
          status: "finished",
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("delete", () => {
    it("should delete an item", async () => {
      await expect(
        deleteWorkOrderItem("wo-uuid-1", "item-uuid-1")
      ).resolves.toBeDefined();
    });

    it("should throw ApiError when item not found", async () => {
      await expect(
        deleteWorkOrderItem("wo-uuid-1", "nonexistent-id")
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

    await expect(listCities()).rejects.toThrow();
  });

  it("should handle non-JSON error responses", async () => {
    server.use(
      http.get("/api/cities", () => {
        return new HttpResponse("Internal Server Error", { status: 500 });
      })
    );

    await expect(listCities()).rejects.toThrow(ApiError);
  });
});
