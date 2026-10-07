import "dotenv/config";
//import { startCleanupTask } from "./services/cleanup.service";



import app from "./app";






// Puerto
const PORT = process.env.PORT || 3000;
//startCleanupTask();
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});