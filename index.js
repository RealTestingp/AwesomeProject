/**
 * @format
 */

/*
* Security Fix (Insecure Data Storage)
* - Must be the first import in the app: crypto-js's AES.encrypt() needs a
*   secure random number source to generate its IV, and React Native has
*   no built-in crypto.getRandomValues. Without this polyfill (imported
*   before crypto-js is used anywhere, including transitively), every
*   CryptoJS.AES.encrypt() call throws "Native crypto module could not be
*   used to get secure random number." — found via manual testing on an
*   Android emulator, where note encryption was silently failing.
*/
import 'react-native-get-random-values';

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
