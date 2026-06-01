/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ActiveTab =
  | 'console'
  | 'logs'
  | 'players'
  | 'maps'
  | 'gamemodes'
  | 'dashboard'
  | 'actions'
  | 'cvars';

export interface ConfirmModalState {
  show: boolean;
  type: 'map' | 'gamemode' | 'action';
  title: string;
  description: string;
  action: () => void;
  data?: any;
}
