import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

/**
 * Capture the ticket view and open the native share sheet with a PNG image.
 */
export const shareTicketAsImage = async (ticketRef) => {
  if (!ticketRef?.current) {
    throw new Error('Ticket is not ready to share yet.');
  }

  const uri = await captureRef(ticketRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not supported on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Share your Tankua ticket',
    UTI: 'public.png',
  });
};
