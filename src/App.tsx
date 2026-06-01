/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeProvider } from './context/ThemeContext';
import { ConfirmModalProvider } from './context/ConfirmModalContext';
import { RconProvider } from './context/RconContext';
import { StatusProvider } from './context/StatusContext';
import { CvarsProvider } from './context/CvarsContext';
import { MapsProvider } from './context/MapsContext';
import { ActiveTabProvider } from './context/ActiveTabContext';
import AppLayout from './components/AppLayout';

export default function App() {
  return (
    <ThemeProvider>
      <ConfirmModalProvider>
        <RconProvider>
          <StatusProvider>
            <CvarsProvider>
              <MapsProvider>
                <ActiveTabProvider>
                  <AppLayout />
                </ActiveTabProvider>
              </MapsProvider>
            </CvarsProvider>
          </StatusProvider>
        </RconProvider>
      </ConfirmModalProvider>
    </ThemeProvider>
  );
}
