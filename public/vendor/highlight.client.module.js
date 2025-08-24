// Wrapper module to expose highlight.js ESM to window.hljs for legacy code
import hljs from './highlight.esm.js';

// Some ESM builds export an object with default; normalize
const client = hljs && hljs.default ? hljs.default : hljs;
window.hljs = client;
export default client;
