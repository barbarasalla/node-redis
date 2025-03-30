import express from "express";
import { createClient } from 'redis';
import responseTime from "response-time";

const app = express()
const PORT = 3000

//Configuracion de Redis
const client = createClient();

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

// Adicionando chave e valor 
/*
await client.set('key', 'value');
const value = await client.get('key');
console.log(value);
*/

// Middleware para parsear JSON en el body de las solicitudes
app.use(express.json());

//Middleware para mostrar en los headers el tiempo de respuesta de la solicitud
app.use(responseTime());

//Endpoint para SET con opciones
app.post("/set", async (req, res) => {
    const {key, value, options } = req.body;

    try{
        await client.set(key, value, options);
        res.send(`La clave "{key}" se guardo con el valor "${value}".`);
    } catch (err) {
        res.status(400).send(`Error al guardar la clave: ${err.message}`);
    }
});
// Para actualzar, se puede usar "XX" (solo actualizar si la clave/valor existe) como true en el valor de "options".
    // Ya "NX" actualiza el valor si existe o lo crea si no.

//Endpoint para GET
app.get("/get/:key", async (req, res) => {
    const { key } = req.params;

    try {
        const value = await client.get(key);
        if (value != null){
            res.send(`Valor de la chave "${key}"; ${value}`);
        } else {
            res.send(`La clave "${key}" no existe o es nula.`);
        }

    } catch(err) {
        res.status(400).send(`Error al o btener la clave: ${err.message}`)
    }
})

// Endpoint para eliminar una clave
app.delete("/delete/:key", async (req, res) => {
    const { key } = req.params;

    try {
        const result = await client.del(key);
        if (result == 1) {
            res.send(`La clave "${key}" fue eliminada extosamente.`);
        } else {
            res.send(`La clave "${key}" no existe.`);
        }
    } catch (err) {
        res.status(400).send(`Error al eliminar la clave: ${err.message}`);
    }
});

// Endpoint para agregar campos en un hash
app.post('/hash', async (req, res) => {
    const {key, field, value} = req.body;

    try {
        await client.hSet(key, field, value);
        res.send(`Campo "${field}" con el valor "${value}" añadido al hash: "${key}".`);
    } catch (err){
        res.status(400).send(`Error al agregar el campo: ${err.message}`);
    }
})

// Endpoint para leer campos en un hash
app.get('/hash/:key/:field', async (req, res) => {
    const {key, field} = req.params;

    try{
        const value = await client.hGet(key, field);
        res.send(`Valor del campo "${field}" en el hash "${key}": ${value}`);
    } catch (err) {
        res.status(400).send(`Error al obtener el campo: ${err.message}`);
    }
});

// Endpoint para eliminar campos en un hash
app.delete("/hash/:key/:field", async (req, res) => {
    const { key, field } = req.params;

    try {
        const result = await client.hDel(key, field);
        res.send(
            result ==1 ? `campo "${field}" eliminado.` : `campo "${field}" no encontrado.`
        );
    } catch (err) {
        res.status(400).send(`Error al eliminar el campo: : ${err.message}`);
    }
})

app.listen(
    PORT, () => {console.log(`Escuchando en el puerto ${PORT}`)}
)
