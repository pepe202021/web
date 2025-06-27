// Carga las variables de entorno del archivo .env
import 'dotenv/config';
import express from 'express';
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { google } from 'googleapis'; // Importamos googleapis


import indexRoutes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- CONFIGURACIÓN DE GOOGLE SHEETS ---
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        // El replace es necesario para que interprete los saltos de línea de la clave
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"], // Usamos .readonly si solo vamos a leer
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// --- Función para obtener datos de Google Sheets ---
// La definimos aquí donde 'sheets' y 'SPREADSHEET_ID' están disponibles.
async function getSheetData() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'usuarios!A2:Z', // Tu rango de datos, como lo tienes
        });
        return response.data.values; // Devuelve solo los valores
    } catch (error) {
        console.error("Error al obtener datos de Google Sheets:", error);
        return []; // En caso de error, devuelve un array vacío
    }
}

// Hacemos 'getSheetData' accesible globalmente en Express a través de app.locals.
// Esto permite que tus archivos de ruta (como indexRoutes) accedan a ella usando req.app.locals.getSheetData.
app.locals.getSheetData = getSheetData;

// Configuración de vistas y archivos estáticos
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(join(__dirname, 'public')));

// --- RUTAS ---
// Usa tu archivo de rutas importado.
// Ahora indexRoutes tendrá acceso a `req.app.locals.getSheetData`
app.use(indexRoutes);

// Ruta para obtener los datos de la hoja (la que ya tenías para /datos)
app.get('/datos', async (req, res) => {
    // Usamos la función refactorizada para obtener los datos
    const data = await getSheetData();
    res.render('datos', { data: data }); // Renderiza 'datos.ejs' con los datos
});

app.get('/head', async (req, res) => {
    try {
        // Obtenemos los datos de la hoja de cálculo
        const data = await getSheetData();

        // Si se pasa una categoría como parámetro en la URL
        const categoriaSeleccionada = req.query.categoria;

        // Filtramos los datos solo si se seleccionó una categoría
        let filteredData = data;
        if (categoriaSeleccionada) {
            filteredData = data.filter(row => row[6] && row[6].toLowerCase() === categoriaSeleccionada.toLowerCase());
        }

        // Renderizamos la vista 'head' con los datos filtrados
        res.render('head', { data: filteredData });

    } catch (error) {
        console.error("Error al obtener los datos:", error);
        res.status(500).send("Hubo un error al obtener los datos.");
    }
});

app.get('/perfil', async (req, res) => {
    try {
        // Obtenemos los datos de la hoja de cálculo
        const data = await getSheetData();

        // Si se pasa una categoría como parámetro en la URL
        const idSeleccionada = req.query.id;

        // Filtramos los datos solo si se seleccionó una id
        let filteredData = data;
        if (idSeleccionada) {
            filteredData = data.filter(row => row[0] && row[0].toLowerCase() === idSeleccionada.toLowerCase());
        }

        // Renderizamos la vista 'perfil' con los datos filtrados
        res.render('perfil', { data: filteredData });

    } catch (error) {
        console.error("Error al obtener los datos:", error);
        res.status(500).send("Hubo un error al obtener los datos.");
    }
});


app.listen(PORT, () => {
    console.log(`Servidor encendido en http://localhost:${PORT}`);
});