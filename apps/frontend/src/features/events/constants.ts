import type { ComponentType, SVGProps } from 'react';
import {
  MdFlight,
  MdRestaurant,
  MdLocalBar,
  MdCelebration,
  MdHome,
  MdShoppingCart,
  MdDirectionsCar,
  MdMovie,
  MdFitnessCenter,
} from 'react-icons/md';

export const EVENT_ICON_OPTIONS = [
  { key: 'flight', label: 'flight', Icon: MdFlight },
  { key: 'restaurant', label: 'restaurant', Icon: MdRestaurant },
  { key: 'local_bar', label: 'local_bar', Icon: MdLocalBar },
  { key: 'celebration', label: 'celebration', Icon: MdCelebration },
  { key: 'house', label: 'house', Icon: MdHome },
  { key: 'shopping_cart', label: 'shopping_cart', Icon: MdShoppingCart },
  { key: 'directions_car', label: 'directions_car', Icon: MdDirectionsCar },
  { key: 'movie', label: 'movie', Icon: MdMovie },
  { key: 'fitness_center', label: 'fitness_center', Icon: MdFitnessCenter },
] as const;

export type EventIconKey = (typeof EVENT_ICON_OPTIONS)[number]['key'];

export const DEFAULT_EVENT_ICON: EventIconKey = 'flight';

const EVENT_ICON_MAP = Object.fromEntries(EVENT_ICON_OPTIONS.map(({ key, Icon }) => [key, Icon])) as Record<
  string,
  ComponentType<SVGProps<SVGSVGElement>>
>;

export function getEventIconComponent(iconKey?: string) {
  if (!iconKey) return undefined;
  return EVENT_ICON_MAP[iconKey];
}
