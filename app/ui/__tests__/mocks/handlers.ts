import { http, HttpResponse } from "msw";
import {
  mockCities,
  mockAircraft,
  mockWorkOrders,
  mockWorkOrderItems,
  mockTools,
  mockToolRooms,
} from "./data";
import type { WorkOrder, AircraftBrief } from "@/types/work-order";
import type { WorkOrderItem } from "@/types/work-order-item";

// Track created items for sequence number generation
let workOrderSequence = mockWorkOrders.length + 1;
let itemSequence = mockWorkOrderItems.length + 1;

export const handlers = [
  // Cities API
  http.get("/api/cities", ({ request }) => {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active_only") !== "false";

    const cities = activeOnly
      ? mockCities.filter((c) => c.is_active)
      : mockCities;

    return HttpResponse.json({
      items: cities,
      total: cities.length,
    });
  }),

  http.get("/api/cities/:id", ({ params }) => {
    const city = mockCities.find((c) => c.id === params.id);
    if (!city) {
      return HttpResponse.json({ detail: "City not found" }, { status: 404 });
    }
    return HttpResponse.json(city);
  }),

  // Work Orders API
  http.get("/api/work-orders", ({ request }) => {
    const url = new URL(request.url);
    const cityId = url.searchParams.get("city_id");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("page_size") || "20");
    const search = url.searchParams.get("search");
    const status = url.searchParams.get("status");

    let filtered = mockWorkOrders.filter((wo) => wo.city.id === cityId);

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (wo) =>
          wo.work_order_number.toLowerCase().includes(searchLower) ||
          wo.customer_name?.toLowerCase().includes(searchLower) ||
          wo.aircraft.registration_number.toLowerCase().includes(searchLower)
      );
    }

    if (status) {
      filtered = filtered.filter((wo) => wo.status === status);
    }

    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      items: paged,
      total: filtered.length,
      page,
      page_size: pageSize,
    });
  }),

  http.get("/api/work-orders/:id", ({ params }) => {
    const workOrder = mockWorkOrders.find((wo) => wo.id === params.id);
    if (!workOrder) {
      return HttpResponse.json(
        { detail: "Work order not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json(workOrder);
  }),

  http.post("/api/work-orders", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const city = mockCities.find((c) => c.id === body.city_id);

    if (!city) {
      return HttpResponse.json(
        { detail: `City not found: ${body.city_id}` },
        { status: 400 }
      );
    }

    const aircraft = mockAircraft.find((a) => a.id === body.aircraft_id);
    if (!aircraft) {
      return HttpResponse.json(
        { detail: `Aircraft not found: ${body.aircraft_id}` },
        { status: 400 }
      );
    }

    const aircraftBrief: AircraftBrief = {
      id: aircraft.id,
      registration_number: aircraft.registration_number,
      serial_number: aircraft.serial_number,
      make: aircraft.make,
      model: aircraft.model,
      year_built: aircraft.year_built,
    };

    const now = new Date().toISOString();
    const newWorkOrder: WorkOrder = {
      id: `wo-uuid-${Date.now()}`,
      work_order_number: `${city.code}${String(workOrderSequence).padStart(5, "0")}-01-2026`,
      sequence_number: workOrderSequence++,
      city: {
        id: city.id,
        code: city.code,
        name: city.name,
      },
      aircraft: aircraftBrief,
      work_order_type: (body.work_order_type as WorkOrder["work_order_type"]) || "work_order",
      status: (body.status as WorkOrder["status"]) || "created",
      status_notes: (body.status_notes as string) || null,
      customer_name: (body.customer_name as string) || null,
      customer_po_number: (body.customer_po_number as string) || null,
      due_date: (body.due_date as string) || null,
      created_date: now,
      completed_date: null,
      lead_technician: (body.lead_technician as string) || null,
      sales_person: (body.sales_person as string) || null,
      priority: (body.priority as WorkOrder["priority"]) || "normal",
      created_by: body.created_by as string,
      updated_by: null,
      created_at: now,
      updated_at: now,
      item_count: 0,
    };

    return HttpResponse.json(newWorkOrder, { status: 201 });
  }),

  http.put("/api/work-orders/:id", async ({ params, request }) => {
    const workOrder = mockWorkOrders.find((wo) => wo.id === params.id);
    if (!workOrder) {
      return HttpResponse.json(
        { detail: "Work order not found" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updated: WorkOrder = {
      ...workOrder,
      ...body,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  http.delete("/api/work-orders/:id", ({ params }) => {
    const workOrder = mockWorkOrders.find((wo) => wo.id === params.id);
    if (!workOrder) {
      return HttpResponse.json(
        { detail: "Work order not found" },
        { status: 404 }
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Work Order Items API
  http.get("/api/work-orders/:workOrderId/items", ({ params }) => {
    const workOrder = mockWorkOrders.find((wo) => wo.id === params.workOrderId);
    if (!workOrder) {
      return HttpResponse.json(
        { detail: "Work order not found" },
        { status: 404 }
      );
    }

    const items = mockWorkOrderItems.filter(
      (item) => item.work_order_id === params.workOrderId
    );

    return HttpResponse.json({
      items,
      total: items.length,
    });
  }),

  http.get("/api/work-orders/:workOrderId/items/:itemId", ({ params }) => {
    const workOrder = mockWorkOrders.find((wo) => wo.id === params.workOrderId);
    if (!workOrder) {
      return HttpResponse.json(
        { detail: "Work order not found" },
        { status: 404 }
      );
    }

    const item = mockWorkOrderItems.find((i) => i.id === params.itemId);
    if (!item || item.work_order_id !== params.workOrderId) {
      return HttpResponse.json(
        { detail: "Work order item not found" },
        { status: 404 }
      );
    }

    return HttpResponse.json(item);
  }),

  http.post("/api/work-orders/:workOrderId/items", async ({ params, request }) => {
    const workOrder = mockWorkOrders.find((wo) => wo.id === params.workOrderId);
    if (!workOrder) {
      return HttpResponse.json(
        { detail: "Work order not found" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const now = new Date().toISOString();

    const newItem: WorkOrderItem = {
      id: `item-uuid-${Date.now()}`,
      work_order_id: params.workOrderId as string,
      item_number: itemSequence++,
      status: (body.status as WorkOrderItem["status"]) || "open",
      discrepancy: (body.discrepancy as string) || null,
      corrective_action: (body.corrective_action as string) || null,
      notes: (body.notes as string) || null,
      category: (body.category as string) || null,
      sub_category: (body.sub_category as string) || null,
      ata_code: (body.ata_code as string) || null,
      hours_estimate: (body.hours_estimate as number) || null,
      billing_method: (body.billing_method as string) || "hourly",
      flat_rate: (body.flat_rate as number) || null,
      department: (body.department as string) || null,
      do_not_bill: (body.do_not_bill as boolean) || false,
      enable_rii: (body.enable_rii as boolean) || false,
      created_by: body.created_by as string,
      updated_by: null,
      created_at: now,
      updated_at: now,
    };

    return HttpResponse.json(newItem, { status: 201 });
  }),

  http.put("/api/work-orders/:workOrderId/items/:itemId", async ({ params, request }) => {
    const workOrder = mockWorkOrders.find((wo) => wo.id === params.workOrderId);
    if (!workOrder) {
      return HttpResponse.json(
        { detail: "Work order not found" },
        { status: 404 }
      );
    }

    const item = mockWorkOrderItems.find((i) => i.id === params.itemId);
    if (!item || item.work_order_id !== params.workOrderId) {
      return HttpResponse.json(
        { detail: "Work order item not found" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updated: WorkOrderItem = {
      ...item,
      ...body,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(updated);
  }),

  http.delete("/api/work-orders/:workOrderId/items/:itemId", ({ params }) => {
    const workOrder = mockWorkOrders.find((wo) => wo.id === params.workOrderId);
    if (!workOrder) {
      return HttpResponse.json(
        { detail: "Work order not found" },
        { status: 404 }
      );
    }

    const item = mockWorkOrderItems.find((i) => i.id === params.itemId);
    if (!item || item.work_order_id !== params.workOrderId) {
      return HttpResponse.json(
        { detail: "Work order item not found" },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // Aircraft API
  http.get("/api/aircraft", ({ request }) => {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active_only") !== "false";
    const search = url.searchParams.get("search");

    let filtered = activeOnly ? mockAircraft.filter((a) => a.is_active) : mockAircraft;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.registration_number.toLowerCase().includes(searchLower) ||
          a.serial_number?.toLowerCase().includes(searchLower) ||
          a.make?.toLowerCase().includes(searchLower) ||
          a.model?.toLowerCase().includes(searchLower)
      );
    }

    return HttpResponse.json({
      items: filtered,
      total: filtered.length,
      page: 1,
      page_size: 100,
    });
  }),

  http.get("/api/aircraft/:id", ({ params }) => {
    const aircraft = mockAircraft.find((a) => a.id === params.id);
    if (!aircraft) {
      return HttpResponse.json({ detail: "Aircraft not found" }, { status: 404 });
    }
    return HttpResponse.json(aircraft);
  }),

  // Tools API
  http.get("/api/tools", ({ request }) => {
    const url = new URL(request.url);
    const cityId = url.searchParams.get("city_id");
    const toolRoomId = url.searchParams.get("tool_room_id");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("page_size") || "25");

    let filtered = mockTools.filter((t) => t.city.id === cityId);

    if (toolRoomId) {
      filtered = filtered.filter((t) => t.tool_room.id === toolRoomId);
    }

    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      items: paged,
      total: filtered.length,
      page,
      page_size: pageSize,
    });
  }),

  // Tool Rooms API
  http.get("/api/tool-rooms", ({ request }) => {
    const url = new URL(request.url);
    const cityId = url.searchParams.get("city_id");
    const activeOnly = url.searchParams.get("active_only") !== "false";

    if (!cityId) {
      return HttpResponse.json(
        { detail: "city_id is required" },
        { status: 422 }
      );
    }

    let filtered = mockToolRooms.filter((tr) => tr.city_id === cityId);
    if (activeOnly) {
      filtered = filtered.filter((tr) => tr.is_active);
    }

    return HttpResponse.json({
      items: filtered,
      total: filtered.length,
    });
  }),
];
