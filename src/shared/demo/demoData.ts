import type { EventParticipant } from '../../features/events/types';
import type { PaymentType } from '../../features/transactions/types';

export const demoEventTitle = 'Fiestas Patronales';
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
  base.setDate(base.getDate() - 10 + day);
  return base.toISOString().slice(0, 10);
}

export const demoTransactions: DemoTransaction[] = [];

// Genera transacciones diarias para 10 días
for (let day = 1; day <= 10; day++) {
  // Pareja que cocina ese día
  const pairIdx = (day - 1) % demoParticipants.length;
  const nextIdx = (pairIdx + 1) % demoParticipants.length;
  const pair = [demoParticipants[pairIdx], demoParticipants[nextIdx]];

  // Gastos de compra de comida
  demoTransactions.push({
    paymentType: 'expense',
    amount: 80,
    participantId: pair[0].id,
    title: `Compra de comida para el día ${day}`,
    date: getDate(day),
  });

  // Gastos de bebida
  demoTransactions.push({
    paymentType: 'expense',
    amount: 30,
    participantId: pair[1].id,
    title: `Compra de bebida para el día ${day}`,
    date: getDate(day),
  });

  // Gastos de limpieza/menaje cada 5 días
  if (day % 5 === 0) {
    demoTransactions.push({
      paymentType: 'expense',
      amount: 40,
      participantId: demoParticipants[(day + 2) % demoParticipants.length].id,
      title: `Compra de material de limpieza y menaje (platos, vasos, cubiertos) día ${day}`,
      date: getDate(day),
    });
  }

  // Cena en restaurante cada 3 días
  if (day % 3 === 0) {
    demoTransactions.push({
      paymentType: 'expense',
      amount: 300,
      participantId: demoParticipants[day % demoParticipants.length].id,
      title: `Cena en restaurante día ${day}`,
      date: getDate(day),
    });
  }

  // Comida en local cocinada por la pareja
  demoTransactions.push({
    paymentType: 'expense',
    amount: 120,
    participantId: pair[0].id,
    title: `Comida en local cocinada por ${pair[0].name} y ${pair[1].name} (día ${day})`,
    date: getDate(day),
  });

  // Cada participante aporta 20€ ese día
  demoParticipants.forEach((p) => {
    demoTransactions.push({
      paymentType: 'contribution',
      amount: 20,
      participantId: p.id,
      title: `Aportación diaria de ${p.name} (día ${day})`,
      date: getDate(day),
    });
  });

  // Aportaciones de varios días para algunos participantes
  if (day === 1) {
    demoTransactions.push({
      paymentType: 'contribution',
      amount: 100,
      participantId: 'ana',
      title: `Aportación de Ana para varios días (días 1-5)`,
      date: getDate(day),
    });
    demoTransactions.push({
      paymentType: 'contribution',
      amount: 80,
      participantId: 'carlos',
      title: `Aportación de Carlos para varios días (días 1-4)`,
      date: getDate(day),
    });
  }
  if (day === 6) {
    demoTransactions.push({
      paymentType: 'contribution',
      amount: 120,
      participantId: 'marta',
      title: `Aportación de Marta para varios días (días 6-10)`,
      date: getDate(day),
    });
    demoTransactions.push({
      paymentType: 'contribution',
      amount: 60,
      participantId: 'lucia',
      title: `Aportación de Lucía para varios días (días 6-8)`,
      date: getDate(day),
    });
  }

  // Reembolso del bote a algunos participantes
  if (day === 10) {
    demoTransactions.push({
      paymentType: 'compensation',
      amount: 50,
      participantId: 'javi',
      title: `Reembolso del bote a Javi (final de fiestas)`,
      date: getDate(day),
    });
    demoTransactions.push({
      paymentType: 'compensation',
      amount: 40,
      participantId: 'sofia',
      title: `Reembolso del bote a Sofía (final de fiestas)`,
      date: getDate(day),
    });
  }
}
