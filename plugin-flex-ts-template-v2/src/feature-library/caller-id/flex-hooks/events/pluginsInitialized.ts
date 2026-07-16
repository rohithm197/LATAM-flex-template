import * as Flex from '@twilio/flex-ui';
import { FlexEvent } from '../../../../types/feature-loader';
import { callerIdList } from '../../config';
import Actions from '../states/OutboundCallerIDSelector/actions';

export const eventName = FlexEvent.pluginsInitialized;

export const eventHook = function initializeCallerIdCountry(
  flex: typeof Flex,
  manager: Flex.Manager
) {
  // -------------------------------------------------
  // 1️⃣ REGISTER OUTBOUND CALL "NAME" MASKING
  // (THIS IS EXACTLY WHAT MITHUN MEANT)
  // -------------------------------------------------
  Actions.registerOutboundCallMasking();

  // -------------------------------------------------
  // 2️⃣ FLEX STRING OVERRIDES
  // Force Flex UI to always show task.attributes.name
  // -------------------------------------------------
  const flexManager = Flex.Manager.getInstance();

  flexManager.strings.TaskHeaderLine = 'outbound call sip';
  flexManager.strings.TaskLineCallAssigned = 'outbound call sip';
  flexManager.strings.TaskLineOutboundCallTitle =
    'outbound call sip';

  // -------------------------------------------------
  // 3️⃣ WORKER LOCATION LOGIC (UNCHANGED)
  // -------------------------------------------------
  const loggedInWorkerLocation =
    manager.workerClient?.attributes.location?.trim() || 'IB';

  let workerLocationPLHUB = loggedInWorkerLocation;

  if (loggedInWorkerLocation.includes('PLHUB')) {
    workerLocationPLHUB = 'IB';
  } else if (loggedInWorkerLocation.includes('CEBIIL')) {
    workerLocationPLHUB = 'IL';
  } else if (loggedInWorkerLocation.includes('PLBIZ')) {
    workerLocationPLHUB = 'UK';
  } else if (loggedInWorkerLocation.includes('TURKEY')) {
    workerLocationPLHUB = 'TR';
  }

  const dynamicCountryCode =
    callerIdList[workerLocationPLHUB]?.country_code;

  console.log('dynamicCountryCode--initialized', dynamicCountryCode);

  // -------------------------------------------------
  // 4️⃣ APPLY OUTBOUND CALL LOCATION
  // -------------------------------------------------
  flexManager.serviceConfiguration.outbound_call_flows.default.location =
    dynamicCountryCode;
};
