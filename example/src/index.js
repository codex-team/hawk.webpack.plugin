/**
 * This is an example of js-application
 * that will be bundled by Webpack with source map creation
 */
import ErrorTrigger from './modules/ErrorTrigger';

const errorTrigger = new ErrorTrigger();

/**
 * Example of a simple js application, that triggers console and hawk message on button click
 */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("myButton").addEventListener("click", errorTrigger.trigger);
});
