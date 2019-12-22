/**
 * This is an example of js-application
 * that will be bundled by Webpack with source map creation
 */
import ModuleA from './moduleA';
import ModuleB from './moduleB';

/**
 * Sample class constructor
 */
export default class SampleApplication {
  /**
   * Sample app constructor
   */
  constructor() {
    this.moduleA = new ModuleA();
    this.moduleB = new ModuleB();
  }
}
