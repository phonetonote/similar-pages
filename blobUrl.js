/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ var __webpack_modules__ = ({

/***/ "./src/workers/blobUrl.js":
/*!********************************!*\
  !*** ./src/workers/blobUrl.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"initializeSelfHostedWorker\": () => (/* binding */ initializeSelfHostedWorker)\n/* harmony export */ });\nvar saveEmbedding = function saveEmbedding(_ref) {\n  var data = _ref.data;\n  if (data[\"method\"]) {\n    var method = data[\"method\"];\n    var pageIds = data[\"pageIds\"];\n    var IDB_NAME = \"sp\";\n    var STRING_STORE = \"fullStrings\";\n    var EMBEDDING_STORE = \"embeddings\";\n    var SIMILARITY_STORE = \"similarities\";\n    if (method === \"init\") {\n      importScripts(\"https://cdn.jsdelivr.net/combine/npm/@tensorflow/tfjs@3.20.0,npm/@tensorflow-models/universal-sentence-encoder@1.3.3,npm/idb@6.0.0/build/iife/index-min.min.js\");\n      use.load().then(function (model) {\n        idb.openDB(IDB_NAME, undefined, {\n          upgrade: function upgrade(db) {\n            [STRING_STORE, EMBEDDING_STORE, SIMILARITY_STORE].forEach(function (store) {\n              if (!db.objectStoreNames.contains(store)) {\n                db.createObjectStore(store);\n              }\n            });\n          }\n        }).then(function (db) {\n          Promise.all(pageIds.map(function (id) {\n            return db.get(STRING_STORE, id);\n          })).then(function (pageStrings) {\n            var _model$embed;\n            model === null || model === void 0 ? void 0 : (_model$embed = model.embed(pageStrings)) === null || _model$embed === void 0 ? void 0 : _model$embed.then(function (embeddings) {\n              embeddings.array().then(function (vec) {\n                var tx = db.transaction([EMBEDDING_STORE, SIMILARITY_STORE], \"readwrite\");\n                var embeddingsStore = tx.objectStore(EMBEDDING_STORE);\n                var operations = pageIds.map(function (id, i) {\n                  embeddingsStore.put(vec[i], id);\n                });\n                Promise.all(operations).then(function () {\n                  tx.done.then(function () {\n                    postMessage({\n                      method: \"complete\",\n                      workersDone: vec.length\n                    });\n                  });\n                });\n              });\n            });\n          });\n        });\n      });\n    }\n  }\n};\nvar initializeSelfHostedWorker = function initializeSelfHostedWorker() {\n  var newBlob = new Blob([\"self.onmessage=\".concat(saveEmbedding.toString())], {\n    type: \"application/javascript\"\n  });\n  var blobURL = URL.createObjectURL(newBlob);\n  return new Worker(blobURL);\n};\n\n\n//# sourceURL=webpack://similar-pages/./src/workers/blobUrl.js?");

/***/ })

/******/ });
/************************************************************************/
/******/ // The require scope
/******/ var __webpack_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
/******/ 
/******/ // startup
/******/ // Load entry module and return exports
/******/ // This entry module can't be inlined because the eval devtool is used.
/******/ var __webpack_exports__ = {};
/******/ __webpack_modules__["./src/workers/blobUrl.js"](0, __webpack_exports__, __webpack_require__);
/******/ var __webpack_exports__initializeSelfHostedWorker = __webpack_exports__.initializeSelfHostedWorker;
/******/ export { __webpack_exports__initializeSelfHostedWorker as initializeSelfHostedWorker };
/******/ 
