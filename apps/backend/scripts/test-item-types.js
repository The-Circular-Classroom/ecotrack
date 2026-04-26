// scripts/test-item-types.js
// Run: npm run dev (terminal 1)
// Then: TEST_SCHOOL_ID=... TEST_CATEGORY_ID=... TEST_PRIMARY_COLOUR_ID=... TEST_SIZE_CATEGORY_ID=... npm run test:item-types
// Node >= 18 required

const BASE = process.env.API_BASE_URL || "http://localhost:3001";

async function http(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${method} ${path}\n` +
        `Response: ${typeof data === "string" ? data : JSON.stringify(data, null, 2)}`
    );
  }

  return { status: res.status, data };
}

function reqNum(name) {
  const v = process.env[name];
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Missing/invalid ${name}. Set ${name} to a number.`);
  return n;
}

function optNum(name) {
  const v = process.env[name];
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${name}. Must be a number if set.`);
  return n;
}

(async () => {
  console.log("BASE:", BASE);

  const schoolId = reqNum("TEST_SCHOOL_ID");
  const categoryId = reqNum("TEST_CATEGORY_ID");
  const primaryColourId = reqNum("TEST_PRIMARY_COLOUR_ID");
  const sizeCategoryId = reqNum("TEST_SIZE_CATEGORY_ID");

  const secondaryColourId = optNum("TEST_SECONDARY_COLOUR_ID");
  const patternId = optNum("TEST_PATTERN_ID");
  const materialId = optNum("TEST_MATERIAL_ID");

  console.log("Using FK IDs:", {
    schoolId,
    categoryId,
    primaryColourId,
    sizeCategoryId,
    secondaryColourId,
    patternId,
    materialId,
  });

  // 1) CREATE
  const created = await http("POST", "/api/item-type", {
    schoolId,
    categoryId,
    primaryColourId,
    sizeCategoryId,
    secondaryColourId,
    patternId,
    materialId,
    gender: "Unisex",
    imageUrl: "https://example.com/test.png",
  });

  const id = created.data.id;
  console.log("CREATE OK id:", id);

  // 2) GET BY ID
  const got = await http("GET", `/api/item-type/${id}`);
  console.log("GET OK id:", got.data.id);

  // 3) LIST (filter by school)
  const list = await http("GET", `/api/item-type?schoolId=${schoolId}&page=1&pageSize=5`);
  console.log("LIST OK items:", (list.data.items || []).length, "total:", list.data.total);

  // 4) UPDATE (change optional relations + fields)
  const updated = await http("PATCH", `/api/item-type/${id}`, {
    gender: "Male",
    imageUrl: "https://example.com/test-updated.png",
    // example: disconnect pattern/material if you want to test null semantics (only if your controller supports it)
    // patternId: null,
    // materialId: null,
  });
  console.log("UPDATE OK gender:", updated.data.gender);

  // 5) DELETE
  try {
    const del = await http("DELETE", `/api/item-type/${id}`);
    console.log("DELETE OK status:", del.status);
  } catch (e) {
    console.error("DELETE failed (expected if referenced by inventory_balance/transactions):");
    console.error(String(e));
  }

  console.log("DONE");
})().catch((e) => {
  console.error("TEST FAILED:");
  console.error(String(e));
  process.exit(1);
});
