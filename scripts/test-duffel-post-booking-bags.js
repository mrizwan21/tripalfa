"use strict";
/**
 * Duffel Post-Booking Bags API Test Suite
 * Tests all baggage service endpoints
 *
 * Usage:
 *   npx ts-node scripts/test-duffel-post-booking-bags.ts              # Run all tests
 *   npx ts-node scripts/test-duffel-post-booking-bags.ts eligibility # Test single endpoint
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
// Configuration from environment variables
var API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3007/api';
var TEST_ORDER_ID = process.env.TEST_ORDER_ID || 'ord_duffel123';
var AUTH_TOKEN = process.env.AUTH_TOKEN || 'test-bearer-token';
var VERBOSE = process.env.VERBOSE === 'true';
var results = [];
// Create axios instance with default headers
var api = axios_1.default.create({
    baseURL: API_BASE_URL,
    headers: {
        'Authorization': "Bearer ".concat(AUTH_TOKEN),
        'Content-Type': 'application/json',
    },
    validateStatus: function () { return true; }, // Don't throw on any status code
});
function log(title, data) {
    console.log("\n".concat(title));
    if (data && VERBOSE) {
        console.log(JSON.stringify(data, null, 2));
    }
}
function logResponse(response) {
    if (VERBOSE) {
        console.log("Status: ".concat(response.status));
        console.log("Data: ".concat(JSON.stringify(response.data, null, 2)));
    }
}
/**
 * Test 1: Check baggage eligibility
 */
function testCheckBaggageEligibility() {
    return __awaiter(this, void 0, void 0, function () {
        var response, passed, eligible, error_1, message;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    log("\n\uD83D\uDCCB Testing: Check Baggage Eligibility");
                    log("Endpoint: GET /bookings/orders/".concat(TEST_ORDER_ID, "/baggage-eligibility"));
                    return [4 /*yield*/, api.get("/bookings/orders/".concat(TEST_ORDER_ID, "/baggage-eligibility"))];
                case 1:
                    response = _d.sent();
                    logResponse(response);
                    passed = response.status === 200 && response.data.success;
                    if (passed) {
                        eligible = (_a = response.data.data) === null || _a === void 0 ? void 0 : _a.eligible;
                        log("\u2705 Eligibility Check Success", {
                            eligible: eligible,
                            availableBaggages: ((_c = (_b = response.data.data) === null || _b === void 0 ? void 0 : _b.availableBaggages) === null || _c === void 0 ? void 0 : _c.length) || 0,
                        });
                    }
                    else {
                        log("\u274C Eligibility Check Failed", response.data);
                    }
                    return [2 /*return*/, {
                            name: 'Check Baggage Eligibility',
                            passed: passed,
                            data: response.data,
                        }];
                case 2:
                    error_1 = _d.sent();
                    message = error_1 instanceof axios_1.AxiosError ? error_1.message : String(error_1);
                    log("\u274C Error checking eligibility: ".concat(message));
                    return [2 /*return*/, {
                            name: 'Check Baggage Eligibility',
                            passed: false,
                            error: message,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test 2: Get available baggages
 */
function testGetAvailableBaggages() {
    return __awaiter(this, void 0, void 0, function () {
        var response, passed, baggages, error_2, message;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    log("\n\uD83D\uDEC4 Testing: Get Available Baggages");
                    log("Endpoint: GET /bookings/orders/".concat(TEST_ORDER_ID, "/available-baggage"));
                    return [4 /*yield*/, api.get("/bookings/orders/".concat(TEST_ORDER_ID, "/available-baggage"))];
                case 1:
                    response = _b.sent();
                    logResponse(response);
                    passed = response.status === 200 && response.data.success;
                    if (passed) {
                        baggages = ((_a = response.data.data) === null || _a === void 0 ? void 0 : _a.baggages) || [];
                        log("\u2705 Available Baggages Retrieved", {
                            count: baggages.length,
                            baggages: baggages.slice(0, 2), // Show first 2
                        });
                        if (baggages.length === 0) {
                            log("\u26A0\uFE0F  Warning: No baggage services available for this order");
                        }
                    }
                    else {
                        log("\u274C Failed to retrieve baggages", response.data);
                    }
                    return [2 /*return*/, {
                            name: 'Get Available Baggages',
                            passed: passed,
                            data: response.data,
                        }];
                case 2:
                    error_2 = _b.sent();
                    message = error_2 instanceof axios_1.AxiosError ? error_2.message : String(error_2);
                    log("\u274C Error retrieving baggages: ".concat(message));
                    return [2 /*return*/, {
                            name: 'Get Available Baggages',
                            passed: false,
                            error: message,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test 3: Get available baggages and extract service IDs for booking
 */
function getAvailableBaggageServices() {
    return __awaiter(this, void 0, void 0, function () {
        var response, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, api.get("/bookings/orders/".concat(TEST_ORDER_ID, "/available-baggage"))];
                case 1:
                    response = _d.sent();
                    return [2 /*return*/, ((_c = (_b = response.data) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.baggages) || []];
                case 2:
                    _a = _d.sent();
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test 4: Book baggage services
 */
function testBookBaggageServices() {
    return __awaiter(this, void 0, void 0, function () {
        var availableBaggages, firstBag, bookingRequest, response, passed, error_3, message;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 3, , 4]);
                    log("\n\uD83C\uDFAB Testing: Book Baggage Services");
                    log("Endpoint: POST /bookings/orders/".concat(TEST_ORDER_ID, "/book-baggage"));
                    return [4 /*yield*/, getAvailableBaggageServices()];
                case 1:
                    availableBaggages = _d.sent();
                    if (availableBaggages.length === 0) {
                        log("\u26A0\uFE0F  Cannot test booking: No available baggages for this order");
                        return [2 /*return*/, {
                                name: 'Book Baggage Services',
                                passed: false,
                                message: 'No available baggages to book',
                            }];
                    }
                    firstBag = availableBaggages[0];
                    bookingRequest = {
                        baggages: [
                            {
                                id: firstBag.id,
                                quantity: 1,
                            },
                        ],
                        payment: {
                            type: 'balance',
                            currency: firstBag.totalCurrency,
                            amount: firstBag.totalAmount,
                        },
                    };
                    log("Booking request:", bookingRequest);
                    return [4 /*yield*/, api.post("/bookings/orders/".concat(TEST_ORDER_ID, "/book-baggage"), bookingRequest)];
                case 2:
                    response = _d.sent();
                    logResponse(response);
                    passed = (response.status === 201 || response.status === 200) && response.data.success;
                    if (passed) {
                        log("\u2705 Baggage Booking Success", {
                            baggagesBooked: (_a = response.data.data) === null || _a === void 0 ? void 0 : _a.baggagesBooked,
                            totalAmount: (_b = response.data.data) === null || _b === void 0 ? void 0 : _b.totalAmount,
                            totalCurrency: (_c = response.data.data) === null || _c === void 0 ? void 0 : _c.totalCurrency,
                        });
                    }
                    else {
                        log("\u274C Baggage Booking Failed", response.data);
                    }
                    return [2 /*return*/, {
                            name: 'Book Baggage Services',
                            passed: passed,
                            data: response.data,
                        }];
                case 3:
                    error_3 = _d.sent();
                    message = error_3 instanceof axios_1.AxiosError ? error_3.message : String(error_3);
                    log("\u274C Error booking baggage: ".concat(message));
                    return [2 /*return*/, {
                            name: 'Book Baggage Services',
                            passed: false,
                            error: message,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test 5: Get booked baggages
 */
function testGetOrderBaggages() {
    return __awaiter(this, void 0, void 0, function () {
        var response, passed, baggages, error_4, message;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    log("\n\uD83D\uDCE6 Testing: Get Booked Baggage Services");
                    log("Endpoint: GET /bookings/orders/".concat(TEST_ORDER_ID, "/baggage-services"));
                    return [4 /*yield*/, api.get("/bookings/orders/".concat(TEST_ORDER_ID, "/baggage-services"))];
                case 1:
                    response = _b.sent();
                    logResponse(response);
                    passed = response.status === 200 && response.data.success;
                    if (passed) {
                        baggages = ((_a = response.data.data) === null || _a === void 0 ? void 0 : _a.baggages) || [];
                        log("\u2705 Booked Baggages Retrieved", {
                            count: baggages.length,
                            baggages: baggages.slice(0, 2), // Show first 2
                        });
                        if (baggages.length === 0) {
                            log("\u2139\uFE0F  Information: No baggage services booked on this order yet");
                        }
                    }
                    else {
                        log("\u274C Failed to retrieve booked baggages", response.data);
                    }
                    return [2 /*return*/, {
                            name: 'Get Booked Baggage Services',
                            passed: passed,
                            data: response.data,
                        }];
                case 2:
                    error_4 = _b.sent();
                    message = error_4 instanceof axios_1.AxiosError ? error_4.message : String(error_4);
                    log("\u274C Error retrieving booked baggages: ".concat(message));
                    return [2 /*return*/, {
                            name: 'Get Booked Baggage Services',
                            passed: false,
                            error: message,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Run complete workflow test
 */
function runCompleteWorkflow() {
    return __awaiter(this, void 0, void 0, function () {
        var eligibilityResult, availableResult, bookedResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log("\n\uD83D\uDD04 Running Complete Workflow Test");
                    log("Order ID: ".concat(TEST_ORDER_ID));
                    log("API Base: ".concat(API_BASE_URL));
                    return [4 /*yield*/, testCheckBaggageEligibility()];
                case 1:
                    eligibilityResult = _a.sent();
                    results.push(eligibilityResult);
                    if (!eligibilityResult.passed) {
                        log("\u274C Workflow stopped: Order not eligible for baggage");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, testGetAvailableBaggages()];
                case 2:
                    availableResult = _a.sent();
                    results.push(availableResult);
                    if (!availableResult.passed) {
                        log("\u274C Workflow stopped: Could not retrieve available baggages");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, testGetOrderBaggages()];
                case 3:
                    bookedResult = _a.sent();
                    results.push(bookedResult);
                    log("\n\u2705 Workflow test complete");
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Run single test by name
 */
function runSingleTest(testName) {
    return __awaiter(this, void 0, void 0, function () {
        var testMap, testFn, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testMap = {
                        eligibility: testCheckBaggageEligibility,
                        available: testGetAvailableBaggages,
                        book: testBookBaggageServices,
                        booked: testGetOrderBaggages,
                    };
                    testFn = testMap[testName.toLowerCase()];
                    if (!testFn) {
                        console.log("\n\u274C Unknown test: ".concat(testName));
                        console.log("Available tests: eligibility, available, book, booked");
                        return [2 /*return*/];
                    }
                    log("\n\uD83E\uDDEA Running single test: ".concat(testName));
                    return [4 /*yield*/, testFn()];
                case 1:
                    result = _a.sent();
                    results.push(result);
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Print test results summary
 */
function printResults() {
    n;
    log("\n".concat('='.repeat(60)));
    log("\uD83D\uDCCA Test Results Summary");
    log("".concat('='.repeat(60)));
    if (results.length === 0) {
        log("No tests ran");
        return;
    }
    var passed = 0;
    var failed = 0;
    results.forEach(function (result) {
        var status = result.passed ? '✅' : '❌';
        console.log("".concat(status, " ").concat(result.name));
        if (result.message) {
            console.log("   Message: ".concat(result.message));
        }
        if (result.error) {
            console.log("   Error: ".concat(result.error));
        }
        if (result.passed) {
            passed++;
        }
        else {
            failed++;
        }
    });
    log("\n\uD83D\uDCC8 Results: ".concat(passed, " passed, ").concat(failed, " failed, ").concat(passed + failed, " total"));
    log("Success rate: ".concat(((passed / (passed + failed)) * 100).toFixed(1), "%"));
    log("".concat('='.repeat(60), "\n"));
}
/**
 * Main execution
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var testArg, failed, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    testArg = process.argv[2];
                    if (!testArg) return [3 /*break*/, 2];
                    // Run single test
                    return [4 /*yield*/, runSingleTest(testArg)];
                case 1:
                    // Run single test
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: 
                // Run complete workflow
                return [4 /*yield*/, runCompleteWorkflow()];
                case 3:
                    // Run complete workflow
                    _a.sent();
                    _a.label = 4;
                case 4:
                    // Print results
                    printResults();
                    failed = results.filter(function (r) { return !r.passed; }).length;
                    process.exit(failed > 0 ? 1 : 0);
                    return [3 /*break*/, 6];
                case 5:
                    error_5 = _a.sent();
                    console.error('Fatal error:', error_5);
                    process.exit(1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Run tests
main();
