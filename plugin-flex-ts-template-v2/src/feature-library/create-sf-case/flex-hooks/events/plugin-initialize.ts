import * as Flex from '@twilio/flex-ui';
import { isSalesForce } from '../../utils/salesforce';
import { loadScript } from '../../utils/load-script';
import { FlexEvent } from '../../../../types/feature-loader';

/**
 * ---------------------------------------------------------
 * Helper: Detect & Mask ALL SIP calls globally
 * ---------------------------------------------------------
 */
const getOutboundDisplayText = (task: Flex.ITask): string => {
  const possibleDestination =
    task.attributes?.outbound_to ||
    task.attributes?.to ||
    task.attributes?.destination ||
    task.attributes?.name ||
    task.attributes?.callTo ||
    '';

  console.log('[SIP FINAL DEBUG] raw destination:', possibleDestination);
  console.log('[SIP FINAL DEBUG] full attributes:', task.attributes);

  if (!possibleDestination) return 'Outbound Call';

  const isSip = possibleDestination.toLowerCase().startsWith('sip:') || possibleDestination.includes('@');

  console.log('[SIP FINAL DEBUG] isSip:', isSip);

  if (isSip) {
    console.log('🚨 SIP DETECTED → HIDING FROM UI');

    const match = possibleDestination.match(/(\+?\d{6,15})/);
    if (match) {
      console.log('[SIP FINAL DEBUG] extracted number:', match[1]);
      return match[1];
    }

    return 'Outbound Call';
  }

  return possibleDestination;
};

export const eventName = FlexEvent.pluginsInitialized;

export const eventHook = async function initializeSalesforceOpenCtiscript(flex: typeof Flex, manager: Flex.Manager) {
  /**
   * ---------------------------------------------------------
   * FIX: Change ONLY activity status dot color
   * ---------------------------------------------------------
   */
  const style = document.createElement('style');

  style.innerHTML = `

/* Activity status dot */
button[data-testid="activity-dropdown-button"] 
div.css-1lk5lfh {
  background-color: red !important;
}

/* Available activity */
button[data-testid="activity-dropdown-button"][aria-label*="Available"] 
div.css-1lk5lfh {
  background-color: #2ecc71 !important;
}

`;

  document.head.appendChild(style);

  const sfdcBaseUrl = window.location.ancestorOrigins[0];
  console.log('create-sf-case initialize called - sfdcBaseUrl' + sfdcBaseUrl);
  console.log('create-sf-case initialize called - CallChannel' + JSON.stringify(flex.DefaultTaskChannels.Call));

  const callChannel = flex.DefaultTaskChannels.Call;

  if (callChannel?.templates?.TaskListItem) {
    callChannel.templates.TaskListItem.firstLine = (task) =>
      task.attributes.direction === 'inbound'
        ? `${task.attributes.country}--${task.attributes.doctorname}: ${task.attributes.name} : <br /> Call SID - ${task.attributes.call_sid}`
        : getOutboundDisplayText(task);
  }

  if (callChannel?.templates?.TaskCanvasHeader) {
    callChannel.templates.TaskCanvasHeader.title = (task) =>
      task.attributes.direction === 'inbound'
        ? `${task.attributes.country}--${task.attributes.doctorname}: ${task.attributes.name} <br> Call SID - ${task.attributes.call_sid}`
        : getOutboundDisplayText(task);
  }

  if (callChannel?.templates?.CallCanvas) {
    callChannel.templates.CallCanvas.firstLine = (task) =>
      task.attributes.direction === 'inbound'
        ? `${task.attributes.country}--${task.attributes.doctorname}: ${task.attributes.name}`
        : getOutboundDisplayText(task);
  }

  flex.TaskChannels.register(callChannel);

  flex.AgentDesktopView.defaultProps.showPanel2 = false;

  if (!isSalesForce(sfdcBaseUrl)) {
    console.log('Not initializing Salesforce since this instance has been launched independently...');
    return;
  }

  const sfApiUrl = `${sfdcBaseUrl}/support/api/53.0/lightning/opencti_min.js`;
  console.log('create-sf-case initialize called - sfApiUrl' + sfApiUrl);

  await loadScript(sfApiUrl);

  if (!(window as any).sforce) {
    console.log('Saleforce cannot be found');
    return;
  }
};
