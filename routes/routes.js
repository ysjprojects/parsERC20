var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import { query, validationResult } from 'express-validator';
import * as dotenv from "dotenv";
dotenv.config();
//require('dotenv').config()
//const express = require('express');
const router = express.Router();
import * as APIERC from "../api-erc.js";
import * as APIBSC from "../api-bsc.js";
//const APIERC = require("../api-erc.ts")
//const APIBSC = require("../api-bsc.ts")
const getERC20TokensOfAddress = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        validationResult(request).throw();
        let address = request.params.address;
        let query = request.query;
        let detailed = query.detailed ? JSON.parse(query.detailed.toString()) : false;
        let metadata = query.metadata ? JSON.parse(query.metadata.toString()) : false;
        let startblock = query.startblock ? JSON.parse(query.startblock.toString()) : 0;
        let tokens = query.tokens ? JSON.parse(query.tokens.toString()) : [];
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
        validationResult(request).throw();
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
        validationResult(request).throw();
        let address = request.params.address;
        let query = request.query;
        let detailed = query.detailed ? JSON.parse(query.detailed.toString()) : false;
        let metadata = query.metadata ? JSON.parse(query.metadata.toString()) : false;
        let startblock = query.startblock ? JSON.parse(query.startblock.toString()) : 0;
        let tokens = query.tokens ? JSON.parse(query.tokens.toString()) : [];
        let result = yield APIBSC.getTokensBEP20({
            "address": address,
            "detailed": detailed,
            "metadata": metadata,
            "startblock": startblock,
            "existingBEP20Tokens": tokens
        });
        response.status(200).json({ "result": result, "query": { "address": address, "detailed": detailed, "metadata": metadata, "startblock": startblock, "existingERC20Tokens": tokens } });
    }
    catch (e) {
        response.status(400).json({ "error": e });
    }
});
const getBEP20TokensOfAddresses = (request, response, NextFunction) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        validationResult(request).throw();
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
    query('tokens').isArray().optional({ nullable: true }).withMessage("List of tokens only"),
    query('startblock').if(query('tokens').exists()).notEmpty().isInt().withMessage("Integers only"),
    query('detailed').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    query('metadata').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    query('secret').optional({ nullable: true }).equals(process.env.API_ADMIN_KEY).withMessage("incorrect secret")
], getERC20TokensOfAddress);
router.get("/api/multi/erc", [
    query('addresses').exists().isString().withMessage("List of account addresses only"),
    query('detailed').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    query('metadata').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    query('secret').exists().equals(process.env.API_ADMIN_KEY).withMessage("Secret required for privileged route")
], getERC20TokensOfAddresses);
router.get("/api/bsc/:address", [
    query('tokens').isArray().optional({ nullable: true }).withMessage("List of tokens only"),
    query('startblock').if(query('tokens').exists()).notEmpty().isInt().withMessage("Integers only"),
    query('detailed').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    query('metadata').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    query('secret').equals(process.env.API_ADMIN_KEY).optional({ nullable: true }).withMessage("incorrect secret")
], getBEP20TokensOfAddress);
router.get("/api/multi/bsc", [
    query('addresses').exists().isString().withMessage("List of account addresses only"),
    query('detailed').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    query('metadata').isBoolean().optional({ nullable: true }).withMessage("Booleans only"),
    query('secret').exists().equals(process.env.API_ADMIN_KEY).withMessage("Secret required for privileged route")
], getBEP20TokensOfAddresses);
export default router;
