/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence } from 'motion/react';
import { useRconContext } from '../context/RconContext';
import { useCvarsContext } from '../context/CvarsContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirmModal } from '../context/ConfirmModalContext';
import Header from './Header';
import Sidebar from './Sidebar';
import RightPane from './RightPane';
import MainArea from './tabs/MainArea';
import ConnectionModal from './modals/ConnectionModal';
import ConfirmModal from './modals/ConfirmModal';
import RawCvarsModal from './modals/RawCvarsModal';

export default function AppLayout() {
  const { theme } = useTheme();
  const { showConfig } = useRconContext();
  const { showRawModal } = useCvarsContext();
  const { confirmModal } = useConfirmModal();

  return (
    <div
      id="app-root"
      className={`h-screen bg-cs-bg-main flex flex-col overflow-hidden text-cs-text selection:bg-cs-yellow/20 ${theme.class}`}
    >
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Column (Icon Sidebar) */}
        <Sidebar />

        {/* Dynamic Center Area */}
        <MainArea />

        {/* Right Dashboard Pane */}
        <RightPane />
      </div>

      {/* Connection Modal Overlay */}
      <AnimatePresence>{showConfig && <ConnectionModal />}</AnimatePresence>

      {/* Raw Output Modal */}
      <AnimatePresence>
        {confirmModal.show && <ConfirmModal />}

        {showRawModal && <RawCvarsModal />}
      </AnimatePresence>
    </div>
  );
}
