import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
    const getSheetData = req.app.locals.getSheetData;
    let data = []; // Inicializamos data como un array vacío por si hay un error

    try {
        data = await getSheetData(); // Llama a la función para obtener los datos de la hoja
    } catch (error) {
        console.error("Error al cargar datos en la ruta principal:", error);
        // Si hay un error, 'data' seguirá siendo un array vacío, lo cual es manejado por el partial.
    }

    res.render('index', {
        title: 'inicio',
        data: data // <<-- ¡Ahora pasamos los datos reales (o un array vacío) a index.ejs!
    });
});

router.get('/about', (req, res) => res.render('about', { title: 'Quienes Somos' }))
router.get('/contact', (req, res) => res.render('contact', { title: 'contacto' }))
router.get('/faq', (req, res) => res.render('faq', { title: 'Preguntas frecuentes' }))

export default router;