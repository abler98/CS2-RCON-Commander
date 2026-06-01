/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence } from 'motion/react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  return (
    <main className="flex-1 flex flex-col bg-cs-bg-console relative overflow-hidden">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/dashboard"
            element={
              <TabPanel className="flex-1 p-8 flex flex-col overflow-y-auto custom-scrollbar">
                <DashboardTab />
              </TabPanel>
            }
          />
          <Route
            path="/actions"
            element={
              <TabPanel className="flex-1 p-8 flex flex-col overflow-y-auto custom-scrollbar">
                <ActionsTab />
              </TabPanel>
            }
          />
          <Route
            path="/cvars"
            element={
              <TabPanel className="flex-1 p-8 flex flex-col overflow-hidden">
                <CvarsTab />
              </TabPanel>
            }
          />
          <Route
            path="/console"
            element={
              <TabPanel className="flex-1 flex flex-col overflow-hidden">
                <ConsoleTab />
              </TabPanel>
            }
          />
          <Route
            path="/logs"
            element={
              <TabPanel className="flex-1 flex flex-col overflow-hidden">
                <LogsTab />
              </TabPanel>
            }
          />
          <Route
            path="/players"
            element={
              <TabPanel className="flex-1 p-8 flex flex-col">
                <PlayersTab />
              </TabPanel>
            }
          />
          <Route
            path="/maps"
            element={
              <TabPanel className="flex-1 p-8 flex flex-col min-h-0">
                <MapsTab />
              </TabPanel>
            }
          />
          <Route
            path="/gamemodes"
            element={
              <TabPanel className="flex-1 p-8 flex flex-col">
                <GameModesTab />
              </TabPanel>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </main>
  );
}
