import { hawk } from '../hawkInstance';

/**
 * This functions is an example of sending a message with hawk cather
 */
export default class ErrorTrigger {
  /**
   * This is function that triggers an error
   */
  trigger() {
    throw new Error('This is a test error');
  }
}