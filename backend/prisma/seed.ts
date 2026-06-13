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
    update: { fullName: 'Керівник ферми' },
    create: {
      fullName: 'Керівник ферми',
      username: 'farm.manager',
      passwordHash,
      role: UserRole.FARM_MANAGER,
    },
  });

  const agronomist = await prisma.user.upsert({
    where: { username: 'agronomist1' },
    update: { fullName: 'Головний агроном' },
    create: {
      fullName: 'Головний агроном',
      username: 'agronomist1',
      passwordHash,
      role: UserRole.AGRONOMIST,
    },
  });

  const salesManager = await prisma.user.upsert({
    where: { username: 'sales.manager' },
    update: { fullName: 'Менеджер з продажу' },
    create: {
      fullName: 'Менеджер з продажу',
      username: 'sales.manager',
      passwordHash,
      role: UserRole.SALES_MANAGER,
    },
  });

  const field = await prisma.field.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {
      name: 'Північне поле',
      location: 'Північний район',
      description: 'Основне пшеничне поле',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Північне поле',
      area: 100,
      location: 'Північний район',
      availableArea: 80,
      description: 'Основне пшеничне поле',
    },
  });

  const crop = await prisma.crop.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {
      name: 'Озима пшениця',
      type: 'Зернові',
      description: 'Високоврожайна озима пшениця',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Озима пшениця',
      type: 'Зернові',
      description: 'Високоврожайна озима пшениця',
    },
  });

  const workType = await prisma.agriculturalWork.upsert({
    where: { id: '00000000-0000-4000-8000-000000000003' },
    update: {
      workType: 'Оранка',
      description: 'Підготовка ґрунту',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000003',
      workType: 'Оранка',
      description: 'Підготовка ґрунту',
    },
  });

  const machinery = await prisma.machinery.upsert({
    where: { inventoryNumber: 'TR-001' },
    update: {
      name: 'Трактор модель X',
      equipmentType: 'Трактор',
      purpose: 'Польові роботи',
    },
    create: {
      name: 'Трактор модель X',
      inventoryNumber: 'TR-001',
      equipmentType: 'Трактор',
      purpose: 'Польові роботи',
      status: MachineryStatus.AVAILABLE,
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { id: '00000000-0000-4000-8000-000000000004' },
    update: {
      name: 'АгроПостач ТОВ',
      address: 'Київ, Україна',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000004',
      name: 'АгроПостач ТОВ',
      contactNumber: '+380501234567',
      address: 'Київ, Україна',
    },
  });

  const fertilizer = await prisma.fertilizer.upsert({
    where: { id: '00000000-0000-4000-8000-000000000005' },
    update: {
      name: 'NPK 20-20-20',
      type: 'Комплексне',
      description: 'Збалансоване добриво',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000005',
      name: 'NPK 20-20-20',
      type: 'Комплексне',
      unit: 'кг',
      description: 'Збалансоване добриво',
    },
  });

  const buyer = await prisma.buyer.upsert({
    where: { id: '00000000-0000-4000-8000-000000000006' },
    update: {
      name: 'Зерноторгівельна компанія',
      address: 'Одеса, Україна',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000006',
      name: 'Зерноторгівельна компанія',
      contactNumber: '+380671112233',
      address: 'Одеса, Україна',
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
    update: { description: 'Початкову оранку завершено' },
    create: {
      id: '00000000-0000-4000-8000-000000000008',
      fieldId: field.id,
      agriculturalWorkId: workType.id,
      machineryId: machinery.id,
      completionDate: new Date('2026-03-10'),
      description: 'Початкову оранку завершено',
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
    update: { unit: 'т' },
    create: {
      cropId: crop.id,
      fieldId: field.id,
      totalQuantity: 1000,
      availableBalance: 1000,
      unit: 'т',
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

  console.log('Сідування успішно завершено');
  console.log('Користувачі за замовчуванням (пароль: password123):');
  console.log('- farm.manager (FARM_MANAGER)');
  console.log('- agronomist1 (AGRONOMIST)');
  console.log('- sales.manager (SALES_MANAGER)');
  console.log('ID керівника ферми:', farmManager.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
