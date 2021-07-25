"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rateLimit = require("express-rate-limit");
require('dotenv').config();
const http = require('http');
const path = require('path');
const router = require('./routes/routes.ts');
const app = express_1.default();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use('/public', express_1.default.static(path.join(__dirname, 'public')));
app.use(express_1.default.json());
const port = process.env.PORT || 3000;
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 100,
    max: 30,
    handler: function (req, res, next) {
        if (req.query.secret && req.query.secret === process.env.API_ADMIN_KEY) {
            next();
        }
        else {
            return res.status(429).json({
                error: 'You sent too many requests. Rate Limit: 30/hr'
            });
        }
    }
});
app.use("/api/", apiLimiter);
app.use('/', router);
app.listen(port, () => {
    console.log(`Listening on port:${port}`);
});
