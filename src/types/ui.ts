/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ConfirmModalState {
  show: boolean;
  type: 'map' | 'gamemode' | 'action';
  title: string;
  description: string;
  action: () => void;
  data?: any;
}
