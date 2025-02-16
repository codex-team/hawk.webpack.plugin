import HawkCatcher from '@hawk.so/javascript';

export const hawk = new HawkCatcher({
  /**
   * Token and release would be replaced with actual values by webpack.definePlugin
   */
  token: HAWK_TOKEN,
  release: RELEASE,
});