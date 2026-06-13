import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import {
  MachineryStatus,
  PaymentStatus,
  PlantingStatus,
  PrismaClient,
  UserRole,
} from '../src/generated/prisma';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const farmManager = await prisma.user.upsert({
    where: { username: 'farm.manager' },
    update: {},
    create: {
      fullName: 'Farm Manager',
      username: 'farm.manager',
      passwordHash,
      role: UserRole.FARM_MANAGER,
    },
  });

  const agronomist = await prisma.user.upsert({
    where: { username: 'agronomist1' },
    update: {},
    create: {
      fullName: 'Primary Agronomist',
      username: 'agronomist1',
      passwordHash,
      role: UserRole.AGRONOMIST,
    },
  });

  const salesManager = await prisma.user.upsert({
    where: { username: 'sales.manager' },
    update: {},
    create: {
      fullName: 'Sales Manager',
      username: 'sales.manager',
      passwordHash,
      role: UserRole.SALES_MANAGER,
    },
  });

  const field = await prisma.field.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'North Field',
      area: 100,
      location: 'North District',
      availableArea: 80,
      description: 'Primary wheat field',
    },
  });

  const crop = await prisma.crop.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Winter Wheat',
      type: 'Cereal',
      description: 'High-yield winter wheat',
    },
  });

  const workType = await prisma.agriculturalWork.upsert({
    where: { id: '00000000-0000-4000-8000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000003',
      workType: 'Plowing',
      description: 'Soil preparation',
    },
  });

  const machinery = await prisma.machinery.upsert({
    where: { inventoryNumber: 'TR-001' },
    update: {},
    create: {
      name: 'Tractor Model X',
      inventoryNumber: 'TR-001',
      equipmentType: 'Tractor',
      purpose: 'Field operations',
      status: MachineryStatus.AVAILABLE,
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { id: '00000000-0000-4000-8000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000004',
      name: 'AgroSupply LLC',
      contactNumber: '+380501234567',
      address: 'Kyiv, Ukraine',
    },
  });

  const fertilizer = await prisma.fertilizer.upsert({
    where: { id: '00000000-0000-4000-8000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000005',
      name: 'NPK 20-20-20',
      type: 'Complex',
      unit: 'kg',
      description: 'Balanced fertilizer',
    },
  });

  const buyer = await prisma.buyer.upsert({
    where: { id: '00000000-0000-4000-8000-000000000006' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000006',
      name: 'Grain Trading Co.',
      contactNumber: '+380671112233',
      address: 'Odesa, Ukraine',
    },
  });

  await prisma.planting.upsert({
    where: { id: '00000000-0000-4000-8000-000000000007' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000007',
      fieldId: field.id,
      cropId: crop.id,
      plantingDate: new Date('2026-03-15'),
      plantedArea: 20,
      status: PlantingStatus.COMPLETED,
      createdById: agronomist.id,
    },
  });

  const workRecord = await prisma.workRecord.upsert({
    where: { id: '00000000-0000-4000-8000-000000000008' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000008',
      fieldId: field.id,
      agriculturalWorkId: workType.id,
      machineryId: machinery.id,
      completionDate: new Date('2026-03-10'),
      description: 'Initial plowing completed',
      createdById: agronomist.id,
    },
  });

  await prisma.machineryUsage.upsert({
    where: { id: '00000000-0000-4000-8000-000000000009' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000009',
      machineryId: machinery.id,
      workRecordId: workRecord.id,
      usageDate: new Date('2026-03-10'),
      operatingHours: 6,
    },
  });

  await prisma.fertilizerPurchase.upsert({
    where: { id: '00000000-0000-4000-8000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000010',
      supplierId: supplier.id,
      fertilizerId: fertilizer.id,
      quantity: 500,
      unitPrice: 25,
      totalAmount: 12500,
      purchaseDate: new Date('2026-02-01'),
      paymentStatus: PaymentStatus.PAID,
      createdById: salesManager.id,
    },
  });

  await prisma.harvestStock.upsert({
    where: {
      cropId_fieldId: { cropId: crop.id, fieldId: field.id },
    },
    update: {},
    create: {
      cropId: crop.id,
      fieldId: field.id,
      totalQuantity: 1000,
      availableBalance: 1000,
      unit: 'ton',
    },
  });

  await prisma.sale.upsert({
    where: { id: '00000000-0000-4000-8000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000011',
      buyerId: buyer.id,
      cropId: crop.id,
      fieldId: field.id,
      quantitySold: 100,
      unitPrice: 300,
      totalAmount: 30000,
      saleDate: new Date('2026-05-20'),
      createdById: salesManager.id,
    },
  });

  await prisma.harvestStock.update({
    where: {
      cropId_fieldId: { cropId: crop.id, fieldId: field.id },
    },
    data: { availableBalance: 900 },
  });

  console.log('Seed completed successfully');
  console.log('Default users (password: password123):');
  console.log('- farm.manager (FARM_MANAGER)');
  console.log('- agronomist1 (AGRONOMIST)');
  console.log('- sales.manager (SALES_MANAGER)');
  console.log('Farm manager id:', farmManager.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
