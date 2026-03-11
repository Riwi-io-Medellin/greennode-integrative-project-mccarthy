import 'dotenv/config';
import app from './src/app.js';
import config from "./src/config/config.js"

app.listen(config.port, () => {
    console.log(`running on http://localhost:${config.port}`);
});