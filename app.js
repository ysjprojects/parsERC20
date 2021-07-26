import express from 'express';
import rateLimit from "express-rate-limit";
import * as path from "path";
import router from "./routes/routes.js";
import * as dotenv from "dotenv";
dotenv.config();
const __dirname = path.resolve();
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());
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
