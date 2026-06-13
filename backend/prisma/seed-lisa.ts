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
    where: { username: 'lisa.manager' },
    update: { fullName: 'Керівник Lisa Farm' },
    create: {
      fullName: 'Керівник Lisa Farm',
      username: 'lisa.manager',
      passwordHash,
      role: UserRole.FARM_MANAGER,
    },
  });

  const agronomist = await prisma.user.upsert({
    where: { username: 'lisa.agronomist' },
    update: { fullName: 'Агроном Lisa Farm' },
    create: {
      fullName: 'Агроном Lisa Farm',
      username: 'lisa.agronomist',
      passwordHash,
      role: UserRole.AGRONOMIST,
    },
  });

  const salesManager = await prisma.user.upsert({
    where: { username: 'lisa.sales' },
    update: { fullName: 'Менеджер продажів Lisa Farm' },
    create: {
      fullName: 'Менеджер продажів Lisa Farm',
      username: 'lisa.sales',
      passwordHash,
      role: UserRole.SALES_MANAGER,
    },
  });

  const field = await prisma.field.upsert({
    where: { id: '00000000-0000-4000-8002-000000000001' },
    update: {
      name: 'Південне поле',
      location: 'Львівський район',
      description: 'Поле під соняшник',
    },
    create: {
      id: '00000000-0000-4000-8002-000000000001',
      name: 'Південне поле',
      area: 150,
      location: 'Львівський район',
      availableArea: 110,
      description: 'Поле під соняшник',
    },
  });

  const crop = await prisma.crop.upsert({
    where: { id: '00000000-0000-4000-8002-000000000002' },
    update: {
      name: 'Соняшник',
      type: 'Олійні',
      description: 'Гібридний соняшник високої олійності',
    },
    create: {
      id: '00000000-0000-4000-8002-000000000002',
      name: 'Соняшник',
      type: 'Олійні',
      description: 'Гібридний соняшник високої олійності',
    },
  });

  const workType = await prisma.agriculturalWork.upsert({
    where: { id: '00000000-0000-4000-8002-000000000003' },
    update: {
      workType: 'Посів',
      description: 'Сівба насіння',
    },
    create: {
      id: '00000000-0000-4000-8002-000000000003',
      workType: 'Посів',
      description: 'Сівба насіння',
    },
  });

  const machinery = await prisma.machinery.upsert({
    where: { inventoryNumber: 'KMB-002' },
    update: {
      name: 'Комбайн Harvest Pro',
      equipmentType: 'Комбайн',
      purpose: 'Збирання врожаю',
    },
    create: {
      name: 'Комбайн Harvest Pro',
      inventoryNumber: 'KMB-002',
      equipmentType: 'Комбайн',
      purpose: 'Збирання врожаю',
      status: MachineryStatus.IN_USE,
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { id: '00000000-0000-4000-8002-000000000004' },
    update: {
      name: 'ЗахідАgro ПП',
      address: 'Львів, Україна',
    },
    create: {
      id: '00000000-0000-4000-8002-000000000004',
      name: 'ЗахідАgro ПП',
      contactNumber: '+380931234567',
      address: 'Львів, Україна',
      additionalInfo: 'Постачальник добрив для заходу України',
    },
  });

  const fertilizer = await prisma.fertilizer.upsert({
    where: { id: '00000000-0000-4000-8002-000000000005' },
    update: {
      name: 'Кarbamid 46%',
      type: 'Мінеральне',
      description: 'Азотне добриво',
    },
    create: {
      id: '00000000-0000-4000-8002-000000000005',
      name: 'Кarbamid 46%',
      type: 'Мінеральне',
      unit: 'кг',
      description: 'Азотне добриво',
    },
  });

  const buyer = await prisma.buyer.upsert({
    where: { id: '00000000-0000-4000-8002-000000000006' },
    update: {
      name: 'ХлібТрейд ТОВ',
      address: 'Львів, Україна',
    },
    create: {
      id: '00000000-0000-4000-8002-000000000006',
      name: 'ХлібТрейд ТОВ',
      contactNumber: '+380971112233',
      address: 'Львів, Україна',
    },
  });

  await prisma.planting.upsert({
    where: { id: '00000000-0000-4000-8002-000000000007' },
    update: { status: PlantingStatus.IN_PROGRESS },
    create: {
      id: '00000000-0000-4000-8002-000000000007',
      fieldId: field.id,
      cropId: crop.id,
      plantingDate: new Date('2026-04-01'),
      plantedArea: 40,
      status: PlantingStatus.IN_PROGRESS,
      createdById: agronomist.id,
    },
  });

  const workRecord = await prisma.workRecord.upsert({
    where: { id: '00000000-0000-4000-8002-000000000008' },
    update: { description: 'Посів соняшнику завершено' },
    create: {
      id: '00000000-0000-4000-8002-000000000008',
      fieldId: field.id,
      agriculturalWorkId: workType.id,
      machineryId: machinery.id,
      completionDate: new Date('2026-04-02'),
      description: 'Посів соняшнику завершено',
      createdById: agronomist.id,
    },
  });

  await prisma.machineryUsage.upsert({
    where: { id: '00000000-0000-4000-8002-000000000009' },
    update: {},
    create: {
      id: '00000000-0000-4000-8002-000000000009',
      machineryId: machinery.id,
      workRecordId: workRecord.id,
      usageDate: new Date('2026-04-02'),
      operatingHours: 8,
    },
  });

  await prisma.fertilizerPurchase.upsert({
    where: { id: '00000000-0000-4000-8002-000000000010' },
    update: { paymentStatus: PaymentStatus.PARTIAL },
    create: {
      id: '00000000-0000-4000-8002-000000000010',
      supplierId: supplier.id,
      fertilizerId: fertilizer.id,
      quantity: 300,
      unitPrice: 18,
      totalAmount: 5400,
      purchaseDate: new Date('2026-03-20'),
      paymentStatus: PaymentStatus.PARTIAL,
      createdById: salesManager.id,
    },
  });

  await prisma.harvestStock.upsert({
    where: {
      cropId_fieldId: { cropId: crop.id, fieldId: field.id },
    },
    update: { unit: 'т', totalQuantity: 750, availableBalance: 650 },
    create: {
      cropId: crop.id,
      fieldId: field.id,
      totalQuantity: 750,
      availableBalance: 750,
      unit: 'т',
    },
  });

  await prisma.sale.upsert({
    where: { id: '00000000-0000-4000-8002-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-4000-8002-000000000011',
      buyerId: buyer.id,
      cropId: crop.id,
      fieldId: field.id,
      quantitySold: 100,
      unitPrice: 280,
      totalAmount: 28000,
      saleDate: new Date('2026-06-15'),
      createdById: salesManager.id,
    },
  });

  await prisma.harvestStock.update({
    where: {
      cropId_fieldId: { cropId: crop.id, fieldId: field.id },
    },
    data: { availableBalance: 650 },
  });

  console.log('Lisa Farm: сідування успішно завершено');
  console.log('Користувачі (пароль: password123):');
  console.log('- lisa.manager (FARM_MANAGER)');
  console.log('- lisa.agronomist (AGRONOMIST)');
  console.log('- lisa.sales (SALES_MANAGER)');
  console.log('ID керівника:', farmManager.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
