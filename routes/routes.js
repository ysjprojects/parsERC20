"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
require('dotenv').config();
const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const APIERC = require("../api-erc.ts");
const APIBSC = require("../api-bsc.ts");
const getERC20TokensOfAddress = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        express_validator_1.validationResult(request).throw();
        let address = request.params.address;
        let query = request.query;
        let detailed = query.detailed ? JSON.parse(query.detailed.toString()) : false;
        let metadata = query.metadata ? JSON.parse(query.metadata.toString()) : false;
        let startblock = query.startblock ? query.startblock : 0;
        let tokens = query.tokens ? query.tokens : [];
        let result = yield APIERC.getTokensERC20({
            "address": address,
            "detailed": detailed,
            "metadata": metadata,
            "startblock": startblock,
            "existingERC20Tokens": tokens
        });
        response.status(200).json({ "result": result, "query": { "address": address, "detailed": detailed, "metadata": metadata, "startblock": startblock, "existingERC20Tokens": tokens } });
    }
    catch (e) {
        response.status(400).json({ "error": e });
    }
});
const getERC20TokensOfAddresses = (request, response, NextFunction) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        express_validator_1.validationResult(request).throw();
        const maxNumAddresses = 20;
        let query = request.query;
        let addresses = query.addresses.toString().split(";");
        if (addresses.length > maxNumAddresses) {
            throw { name: "AddressesMaxLengthError", message: `max ${maxNumAddresses} addresses allowed in query` };
        }
        let detailed = query.detailed ? JSON.parse(query.detailed.toString()) : false;
        let metadata = query.metadata ? JSON.parse(query.metadata.toString()) : false;
        let results = [];
        const getAddressData = (a) => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield APIERC.getTokensERC20({
                "address": a,
                "detailed": detailed,
                "metadata": metadata
            });
            results.push({ "address": a, "result": res });
        });
        let result = yield Promise.all(addresses.map(a => {
            return getAddressData(a);
        }));
        response.status(200).json({ "result": results, "query": { "addresses": addresses, "detailed": detailed, "metadata": metadata } });
    }
    catch (e) {
        response.status(400).json({ "error": e });
    }
});
const getBEP20TokensOfAddress = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        express_validator_1.validationResult(request).throw();
        let address = request.params.address;
        let query = request.query;
        let detailed = query.detailed ? JSON.parse(query.detailed.toString()) : false;
        let metadata = query.metadata ? JSON.parse(query.metadata.toString()) : false;
        let startblock = query.startblock ? query.startblock : 0;
        let tokens = query.tokens ? query.tokens : [];
        let result = yield APIBSC.getTokensBEP20({
            "address": address,
            "detailed": detailed,
            "metadata": metadata,
            "startblock": startblock,
            "existingERC20Tokens": tokens
        });
        response.status(200).json({ "result": result, "query": { "address": address, "detailed": detailed, "metadata": metadata, "startblock": startblock, "existingERC20Tokens": tokens } });
    }
    catch (e) {
        response.status(400).json({ "error": e });
    }
});
const getBEP20TokensOfAddresses = (request, response, NextFunction) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        express_validator_1.validationResult(request).throw();
        const maxNumAddresses = 20;
        let query = request.query;
        let addresses = query.addresses.toString().split(";");
        if (addresses.length > maxNumAddresses) {
            throw { name: "AddressesMaxLengthError", message: `max ${maxNumAddresses} addresses allowed in query` };
        }
        let detailed = query.detailed ? JSON.parse(query.detailed.toString()) : false;
        let metadata = query.metadata ? JSON.parse(query.metadata.toString()) : false;
        let results = [];
        const getAddressData = (a) => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield APIBSC.getTokensBEP20({
                "address": a,
                "detailed": detailed,
                "metadata": metadata
            });
            results.push({ "address": a, "result": res });
        });
        let result = yield Promise.all(addresses.map(a => {
            return getAddressData(a);
        }));
        response.status(200).json({ "result": results, "query": { "addresses": addresses, "detailed": detailed, "metadata": metadata } });
    }
    catch (e) {
        response.status(400).json({ "error": e });
    }
});
router.get('/', function (req, res, next) {
    res.render('index');
});
router.get("/api/erc/:address", [
    express_validator_1.query('tokens').isArray().optional({ nullable: true }).withMessage("List of tokens only"),
    express_validator_1.query('startblock').if(express_validator_1.query('tokens').exists()).notEmpty().isInt().withMessage("Integers only"),
    express_validator_1.query('detailed').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    express_validator_1.query('metadata').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    express_validator_1.query('secret').optional({ nullable: true }).equals(process.env.API_ADMIN_KEY).withMessage("incorrect secret")
], getERC20TokensOfAddress);
router.get("/api/multi/erc", [
    express_validator_1.query('addresses').exists().isString().withMessage("List of account addresses only"),
    express_validator_1.query('detailed').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    express_validator_1.query('metadata').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    express_validator_1.query('secret').exists().equals(process.env.API_ADMIN_KEY).withMessage("Secret required for privileged route")
], getERC20TokensOfAddresses);
router.get("/api/bsc/:address", [
    express_validator_1.query('tokens').isArray().optional({ nullable: true }).withMessage("List of tokens only"),
    express_validator_1.query('startblock').if(express_validator_1.query('tokens').exists()).notEmpty().isInt().withMessage("Integers only"),
    express_validator_1.query('detailed').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    express_validator_1.query('metadata').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    express_validator_1.query('secret').equals(process.env.API_ADMIN_KEY).optional({ nullable: true }).withMessage("incorrect secret")
], getBEP20TokensOfAddress);
router.get("/api/multi/bsc", [
    express_validator_1.query('addresses').exists().isString().withMessage("List of account addresses only"),
    express_validator_1.query('detailed').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    express_validator_1.query('metadata').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    express_validator_1.query('secret').exists().equals(process.env.API_ADMIN_KEY).withMessage("Secret required for privileged route")
], getBEP20TokensOfAddresses);
module.exports = router;
