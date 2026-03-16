import 'dotenv/config';
import app from './app.js';
import config from "./src/config/config.js"

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});