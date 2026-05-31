import { prisma } from '@/lib/prisma';

async function createRecord(modelName, data) {
  return prisma[modelName].create({ data });
}

async function listRecords(modelName, orderBy) {
  return prisma[modelName].findMany({ orderBy });
}

async function getRecordById(modelName, id) {
  return prisma[modelName].findUnique({ where: { id } });
}

async function updateRecord(modelName, id, data) {
  return prisma[modelName].update({ where: { id }, data });
}

async function deleteRecord(modelName, id) {
  return prisma[modelName].delete({ where: { id } });
}

export const lookupCrud = {
  category: {
    async create(data) { return createRecord('category', data); },
    async list() { return listRecords('category', { id: 'asc' }); },
    async get(id) { return getRecordById('category', id); },
    async update(id, data) { return updateRecord('category', id, data); },
    async delete(id) { return deleteRecord('category', id); },
  },
  colour: {
    async create(data) { return createRecord('colour', data); },
    async list() { return listRecords('colour', { id: 'asc' }); },
    async get(id) { return getRecordById('colour', id); },
    async update(id, data) { return updateRecord('colour', id, data); },
    async delete(id) { return deleteRecord('colour', id); },
  },
  pattern: {
    async create(data) { return createRecord('pattern', data); },
    async list() { return listRecords('pattern', { id: 'asc' }); },
    async get(id) { return getRecordById('pattern', id); },
    async update(id, data) { return updateRecord('pattern', id, data); },
    async delete(id) { return deleteRecord('pattern', id); },
  },
  material: {
    async create(data) { return createRecord('material', data); },
    async list() { return listRecords('material', { id: 'asc' }); },
    async get(id) { return getRecordById('material', id); },
    async update(id, data) { return updateRecord('material', id, data); },
    async delete(id) { return deleteRecord('material', id); },
  },
  brand: {
    async create(data) { return createRecord('brandSupplier', data); },
    async list() { return listRecords('brandSupplier', { id: 'asc' }); },
    async get(id) { return getRecordById('brandSupplier', id); },
    async update(id, data) { return updateRecord('brandSupplier', id, data); },
    async delete(id) { return deleteRecord('brandSupplier', id); },
  },
  tag: {
    async create(data) { return createRecord('tag', data); },
    async list() { return listRecords('tag', { id: 'asc' }); },
    async get(id) { return getRecordById('tag', id); },
    async update(id, data) { return updateRecord('tag', id, data); },
    async delete(id) { return deleteRecord('tag', id); },
  },
  sizeCategory: {
    async create(data) { return createRecord('sizeCategory', data); },
    async list() { return listRecords('sizeCategory', { id: 'asc' }); },
    async get(id) { return getRecordById('sizeCategory', id); },
    async update(id, data) { return updateRecord('sizeCategory', id, data); },
    async delete(id) { return deleteRecord('sizeCategory', id); },
  },
  sizeOption: {
    async create(data) { return createRecord('sizeOption', data); },
    async list() { return listRecords('sizeOption', [{ sizeCategoryId: 'asc' }, { sortOrder: 'asc' }]); },
    async get(id) { return getRecordById('sizeOption', id); },
    async update(id, data) { return updateRecord('sizeOption', id, data); },
    async delete(id) { return deleteRecord('sizeOption', id); },
  },
  itemType: {
    async create(data) { return createRecord('itemType', data); },
    async list() {
      return prisma.itemType.findMany({
        orderBy: { id: 'asc' },
        include: {
          school: true,
          category: true,
          primaryColour: true,
          secondaryColour: true,
          pattern: true,
          material: true,
          sizeCategory: true,
        },
      });
    },
    async get(id) {
      return prisma.itemType.findUnique({
        where: { id },
        include: {
          school: true,
          category: true,
          primaryColour: true,
          secondaryColour: true,
          pattern: true,
          material: true,
          sizeCategory: true,
        },
      });
    },
    async update(id, data) { return updateRecord('itemType', id, data); },
    async delete(id) { return deleteRecord('itemType', id); },
    async listAdminItems() {
      return prisma.itemType.findMany({
        orderBy: { id: 'asc' },
        include: {
          school: true,
          category: true,
          primaryColour: true,
          secondaryColour: true,
          pattern: true,
          material: true,
          sizeCategory: true,
          inventoryBalance: true,
        },
      });
    },
    async listPsgItems() {
      return prisma.itemType.findMany({
        orderBy: { id: 'asc' },
        include: {
          school: true,
          category: true,
          primaryColour: true,
          secondaryColour: true,
          pattern: true,
          material: true,
          sizeCategory: true,
        },
      });
    },
  },
};

export async function getItemTypeTagsByItemTypeId(itemTypeId) {
  return prisma.itemTypeTag.findMany({
    where: { itemTypeId },
    include: { tag: true, itemType: true },
  });
}

export async function getItemTypeTagsById(tagId) {
  return prisma.itemTypeTag.findMany({
    where: { tagId },
    include: { tag: true, itemType: true },
  });
}

export function parseLookupInput(body, fields) {
  const data = {};
  for (const field of fields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
}

