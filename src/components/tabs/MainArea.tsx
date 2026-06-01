/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence } from 'motion/react';
import { useActiveTab } from '../../context/ActiveTabContext';
import TabPanel from '../TabPanel';
import DashboardTab from './DashboardTab';
import ActionsTab from './ActionsTab';
import CvarsTab from './CvarsTab';
import ConsoleTab from './ConsoleTab';
import LogsTab from './LogsTab';
import PlayersTab from './PlayersTab';
import MapsTab from './MapsTab';
import GameModesTab from './GameModesTab';

export default function MainArea() {
  const { activeTab } = useActiveTab();

  return (
    <main className="flex-1 flex flex-col bg-cs-bg-console relative overflow-hidden">
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <TabPanel key="dashboard" className="flex-1 p-8 flex flex-col overflow-y-auto custom-scrollbar">
            <DashboardTab />
          </TabPanel>
        )}
        {activeTab === 'actions' && (
          <TabPanel key="actions" className="flex-1 p-8 flex flex-col overflow-y-auto custom-scrollbar">
            <ActionsTab />
          </TabPanel>
        )}
        {activeTab === 'cvars' && (
          <TabPanel key="cvars" className="flex-1 p-8 flex flex-col overflow-hidden">
            <CvarsTab />
          </TabPanel>
        )}
        {activeTab === 'console' && (
          <TabPanel key="console" className="flex-1 flex flex-col overflow-hidden">
            <ConsoleTab />
          </TabPanel>
        )}
        {activeTab === 'logs' && (
          <TabPanel key="logs" className="flex-1 flex flex-col overflow-hidden">
            <LogsTab />
          </TabPanel>
        )}
        {activeTab === 'players' && (
          <TabPanel key="players" className="flex-1 p-8 flex flex-col">
            <PlayersTab />
          </TabPanel>
        )}
        {activeTab === 'maps' && (
          <TabPanel key="maps" className="flex-1 p-8 flex flex-col min-h-0">
            <MapsTab />
          </TabPanel>
        )}
        {activeTab === 'gamemodes' && (
          <TabPanel key="gamemodes" className="flex-1 p-8 flex flex-col">
            <GameModesTab />
          </TabPanel>
        )}
      </AnimatePresence>
    </main>
  );
}
