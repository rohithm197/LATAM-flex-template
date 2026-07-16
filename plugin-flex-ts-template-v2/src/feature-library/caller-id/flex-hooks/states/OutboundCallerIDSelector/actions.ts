import * as Flex from '@twilio/flex-ui';
import { Manager } from '@twilio/flex-ui';

import { Action } from '../../../../../types/manager';
import PhoneNumberService from '../../../../../utils/serverless/PhoneNumbers/PhoneNumberService';
import { FETCH_PHONE_NUMBERS, SET_CALLER_ID } from './types';
import { isOutgoingOnlyNumbersEnabled } from '../../../config';

class Actions {
  // -----------------------------
  // EXISTING CODE (UNCHANGED)
  // -----------------------------
  public static getPhoneNumbers = (): Action => {
    return {
      type: FETCH_PHONE_NUMBERS,
      payload: {
        promise: PhoneNumberService.getAccountPhoneNumbers(isOutgoingOnlyNumbersEnabled()),
      },
    };
  };

  public static setCallerId = (selectedCallerId: string): Action => {
    const { workerClient } = Manager.getInstance();

    if (selectedCallerId === 'placeholder') {
      selectedCallerId = '';
    }

    return {
      type: SET_CALLER_ID,
      payload: {
        promise: workerClient?.setAttributes({
          ...workerClient.attributes,
          selectedCallerId,
        }),
      },
    };
  };

  public static registerOutboundCallMasking(): void {
    Flex.Actions.addListener('beforeStartOutboundCall', (payload: any) => {
      const destination = payload.destination;

      payload.taskAttributes = {
        ...payload.taskAttributes,

        // ✅ Clean UI label
        name: typeof destination === 'string' ? 'outbound call sip' : 'Outbound Call',
      };
    });
  }
}

export default Actions;
