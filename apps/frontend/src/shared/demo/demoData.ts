import type { EventParticipant } from '../../features/events/types';
import type { PaymentType } from '../../features/transactions/types';
import { POT_PARTICIPANT_ID } from '../constants/pot';

export const demoEventTitle = 'Fiestas Patronales (Demo)';
export const demoParticipants: EventParticipant[] = [
  { name: 'Ana', id: 'ana' },
  { name: 'Luis', id: 'luis' },
  { name: 'Marta', id: 'marta' },
  { name: 'Carlos', id: 'carlos' },
  { name: 'Sofía', id: 'sofia' },
  { name: 'Javi', id: 'javi' },
  { name: 'Elena', id: 'elena' },
  { name: 'Raúl', id: 'raul' },
  { name: 'Lucía', id: 'lucia' },
  { name: 'Pablo', id: 'pablo' },
  { name: 'Sara', id: 'sara' },
  { name: 'David', id: 'david' },
  { name: 'Nuria', id: 'nuria' },
  { name: 'Miguel', id: 'miguel' },
  { name: 'Laura', id: 'laura' },
];

export interface DemoTransaction {
  paymentType: PaymentType;
  amount: number;
  participantId: string;
  title: string;
  date: string;
}

function getDate(day: number) {
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() - 20 + day);
  return base.toISOString().slice(0, 10);
}

export const demoTransactions: DemoTransaction[] = [];

// Genera transacciones realistas para 20 días de fiestas
for (let day = 1; day <= 20; day++) {
  // Pareja que cocina ese día (rotación)
  const pairIdx = (day - 1) % demoParticipants.length;
  const nextIdx = (pairIdx + 1) % demoParticipants.length;
  const pair = [demoParticipants[pairIdx], demoParticipants[nextIdx]];

  // ==========================================
  // DÍA 1: Inicio de fiestas - Gastos de setup
  // ==========================================
  if (day === 1) {
    // Gasto del bote: Alquiler del local
    demoTransactions.push({
      paymentType: 'expense',
      amount: 800,
      participantId: POT_PARTICIPANT_ID,
      title: 'Alquiler del local para las fiestas (20 días)',
      date: getDate(day),
    });
    // Gasto del bote: Seguro
    demoTransactions.push({
      paymentType: 'expense',
      amount: 200,
      participantId: POT_PARTICIPANT_ID,
      title: 'Seguro de responsabilidad civil',
      date: getDate(day),
    });
    // Ana adelanta dinero para decoración
    demoTransactions.push({
      paymentType: 'expense',
      amount: 150,
      participantId: 'ana',
      title: 'Decoración, guirnaldas y carteles',
      date: getDate(day),
    });
    // Carlos compra utensilios de cocina
    demoTransactions.push({
      paymentType: 'expense',
      amount: 180,
      participantId: 'carlos',
      title: 'Menaje de cocina (ollas, sartenes, cubiertos)',
      date: getDate(day),
    });
    // Aportaciones iniciales generosas
    demoTransactions.push({
      paymentType: 'contribution',
      amount: 150,
      participantId: 'ana',
      title: 'Aportación inicial de Ana',
      date: getDate(day),
    });
    demoTransactions.push({
      paymentType: 'contribution',
      amount: 120,
      participantId: 'carlos',
      title: 'Aportación inicial de Carlos',
      date: getDate(day),
    });
    demoTransactions.push({
      paymentType: 'contribution',
      amount: 100,
      participantId: 'marta',
      title: 'Aportación inicial de Marta',
      date: getDate(day),
    });
  }

  // ==========================================
  // DÍA 3: Cena especial de bienvenida
  // ==========================================
  if (day === 3) {
    demoTransactions.push({
      paymentType: 'expense',
      amount: 380,
      participantId: 'luis',
      title: 'Cena de bienvenida en Restaurante La Peña',
      date: getDate(day),
    });
    // Contribuciones adicionales para cubrir la cena
    ['sofia', 'javi', 'elena'].forEach((id) => {
      demoTransactions.push({
        paymentType: 'contribution',
        amount: 50,
        participantId: id,
        title: `Aportación extra de ${demoParticipants.find((p) => p.id === id)?.name} para cena`,
        date: getDate(day),
      });
    });
  }

  // ==========================================
  // DÍA 5: Primer reembolso
  // ==========================================
  if (day === 5) {
    demoTransactions.push({
      paymentType: 'compensation',
      amount: 80,
      participantId: 'ana',
      title: 'Reembolso parcial a Ana por adelanto de decoración',
      date: getDate(day),
    });
    // Gasto del bote: Limpieza profesional
    demoTransactions.push({
      paymentType: 'expense',
      amount: 120,
      participantId: POT_PARTICIPANT_ID,
      title: 'Servicio de limpieza profesional semanal',
      date: getDate(day),
    });
  }

  // ==========================================
  // DÍA 7: Excursión (día sin cocina)
  // ==========================================
  if (day === 7) {
    demoTransactions.push({
      paymentType: 'expense',
      amount: 450,
      participantId: 'raul',
      title: 'Excursión a la playa con paella incluida',
      date: getDate(day),
    });
    // Solo algunas personas contribuyen ese día
    ['ana', 'carlos', 'marta', 'luis', 'sofia', 'javi'].forEach((id) => {
      demoTransactions.push({
        paymentType: 'contribution',
        amount: 35,
        participantId: id,
        title: `Aportación de ${demoParticipants.find((p) => p.id === id)?.name} para excursión`,
        date: getDate(day),
      });
    });
  }

  // ==========================================
  // DÍA 10: Mitad de fiestas - Balance intermedio
  // ==========================================
  if (day === 10) {
    // Reembolsos a quienes más han gastado
    demoTransactions.push({
      paymentType: 'compensation',
      amount: 100,
      participantId: 'carlos',
      title: 'Reembolso a Carlos por menaje de cocina',
      date: getDate(day),
    });
    demoTransactions.push({
      paymentType: 'compensation',
      amount: 70,
      participantId: 'ana',
      title: 'Reembolso complementario a Ana',
      date: getDate(day),
    });
    // Gasto del bote: Reparación
    demoTransactions.push({
      paymentType: 'expense',
      amount: 85,
      participantId: POT_PARTICIPANT_ID,
      title: 'Reparación de nevera del local',
      date: getDate(day),
    });
  }

  // ==========================================
  // DÍA 14: Cena especial temática
  // ==========================================
  if (day === 14) {
    demoTransactions.push({
      paymentType: 'expense',
      amount: 320,
      participantId: 'lucia',
      title: 'Cena temática años 80 con DJ',
      date: getDate(day),
    });
    demoTransactions.push({
      paymentType: 'expense',
      amount: 90,
      participantId: 'pablo',
      title: 'Disfraces y decoración temática',
      date: getDate(day),
    });
  }

  // ==========================================
  // DÍA 17: Barbacoa especial
  // ==========================================
  if (day === 17) {
    demoTransactions.push({
      paymentType: 'expense',
      amount: 220,
      participantId: 'david',
      title: 'Barbacoa: carne, embutidos y parrillada',
      date: getDate(day),
    });
    demoTransactions.push({
      paymentType: 'expense',
      amount: 65,
      participantId: 'sara',
      title: 'Ensaladas y guarniciones para barbacoa',
      date: getDate(day),
    });
  }

  // ==========================================
  // DÍA 20: Cierre de fiestas
  // ==========================================
  if (day === 20) {
    // Gasto del bote: Limpieza final
    demoTransactions.push({
      paymentType: 'expense',
      amount: 150,
      participantId: POT_PARTICIPANT_ID,
      title: 'Limpieza profunda y retirada de equipamiento',
      date: getDate(day),
    });
    // Última cena especial
    demoTransactions.push({
      paymentType: 'expense',
      amount: 280,
      participantId: 'miguel',
      title: 'Cena de despedida en Restaurante El Mirador',
      date: getDate(day),
    });
    // Reembolsos finales
    demoTransactions.push({
      paymentType: 'compensation',
      amount: 95,
      participantId: 'raul',
      title: 'Reembolso final a Raúl por excursión',
      date: getDate(day),
    });
    demoTransactions.push({
      paymentType: 'compensation',
      amount: 60,
      participantId: 'lucia',
      title: 'Reembolso final a Lucía por cena temática',
      date: getDate(day),
    });
  }

  // ==========================================
  // GASTOS DIARIOS HABITUALES (todos los días)
  // ==========================================

  // Compra de comida (varía según tipo de día)
  const foodAmount = day % 7 === 0 ? 0 : day % 3 === 0 ? 120 : 85; // Sin comida en día 7, más en días especiales
  if (foodAmount > 0) {
    demoTransactions.push({
      paymentType: 'expense',
      amount: foodAmount,
      participantId: pair[0].id,
      title: `Compra en supermercado: comida día ${day}`,
      date: getDate(day),
    });
  }

  // Bebidas (menos en día de excursión)
  const drinkAmount = day === 7 ? 0 : day % 5 === 0 ? 55 : 35;
  if (drinkAmount > 0) {
    demoTransactions.push({
      paymentType: 'expense',
      amount: drinkAmount,
      participantId: pair[1].id,
      title: `Bebidas y refrescos día ${day}`,
      date: getDate(day),
    });
  }

  // Pan y desayuno diario
  demoTransactions.push({
    paymentType: 'expense',
    amount: 18,
    participantId: demoParticipants[(day + 2) % demoParticipants.length].id,
    title: `Panadería: pan y bollería día ${day}`,
    date: getDate(day),
  });

  // Limpieza básica (cada 3 días)
  if (day % 3 === 0 && day !== 5 && day !== 20) {
    demoTransactions.push({
      paymentType: 'expense',
      amount: 25,
      participantId: demoParticipants[(day + 5) % demoParticipants.length].id,
      title: `Productos de limpieza día ${day}`,
      date: getDate(day),
    });
  }

  // ==========================================
  // APORTACIONES DIARIAS
  // ==========================================

  // Estrategia: algunos aportan diariamente, otros semanalmente
  if (day <= 7 || day > 14) {
    // Grupo 1: Aportan casi todos los días (30€)
    ['ana', 'carlos', 'marta', 'luis'].forEach((id) => {
      demoTransactions.push({
        paymentType: 'contribution',
        amount: 30,
        participantId: id,
        title: `Aportación diaria de ${demoParticipants.find((p) => p.id === id)?.name}`,
        date: getDate(day),
      });
    });
  }

  if (day % 2 === 0) {
    // Grupo 2: Aportan cada 2 días (50€)
    ['sofia', 'javi', 'elena', 'raul'].forEach((id) => {
      demoTransactions.push({
        paymentType: 'contribution',
        amount: 50,
        participantId: id,
        title: `Aportación de ${demoParticipants.find((p) => p.id === id)?.name}`,
        date: getDate(day),
      });
    });
  }

  if (day % 5 === 0) {
    // Grupo 3: Aportan semanalmente (cantidades grandes)
    ['lucia', 'pablo', 'sara', 'david', 'nuria', 'miguel', 'laura'].forEach((id) => {
      demoTransactions.push({
        paymentType: 'contribution',
        amount: 120,
        participantId: id,
        title: `Aportación semanal de ${demoParticipants.find((p) => p.id === id)?.name}`,
        date: getDate(day),
      });
    });
  }
}
