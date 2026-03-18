import "./src/config/env.js";
import app from "./app.js";
import { testDBConnection } from "./src/config/db.js";
const PORT = process.env.PORT || 3000;

testDBConnection();

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});