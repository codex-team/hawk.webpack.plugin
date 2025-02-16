import HawkCatcher from '@hawk.so/javascript';

export const hawk = new HawkCatcher({
  token: process.env.HAWK_TOKEN,
  release: process.env.RELEASE,
});